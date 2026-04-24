import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Hoisted mocks ---
const { listMock, createMock, sendMock } = vi.hoisted(() => ({
  listMock: vi.fn(),
  createMock: vi.fn(),
  sendMock: vi.fn(),
}))

vi.mock('@polar-sh/sdk', () => ({
  Polar: class {
    customers = { list: listMock }
    customerSessions = { create: createMock }
  },
}))

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock }
  },
}))

// --- Helpers ---
function makeRequest(body: unknown) {
  return new Request('http://localhost:3000/api/account/portal', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  })
}

function fakeCustomer(id = 'cust_abc') {
  return { id, email: 'a@b.com' }
}

function fakeSession(overrides: Partial<{ customerPortalUrl: string; expiresAt: Date }> = {}) {
  return {
    id: 'cs_1',
    token: 'tok_1',
    customerPortalUrl: 'https://polar.sh/portal/cs_1',
    expiresAt: new Date('2030-01-01T00:00:00Z'),
    returnUrl: 'https://usertourkit.com/account',
    customerId: 'cust_abc',
    customer: fakeCustomer(),
    createdAt: new Date('2030-01-01T00:00:00Z'),
    modifiedAt: null,
    ...overrides,
  }
}

async function getPost() {
  const mod = await import('../route')
  return mod.POST
}

// --- Setup ---
let errorSpy: ReturnType<typeof vi.spyOn>

beforeEach(() => {
  vi.stubEnv('POLAR_ACCESS_TOKEN', 'polar_oat_test')
  vi.stubEnv('RESEND_API_KEY', 're_test')
  errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
  listMock.mockReset()
  createMock.mockReset()
  sendMock.mockReset()
  sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null })
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// === Validation ===
describe('Input validation', () => {
  it('returns 400 for missing body', async () => {
    const POST = await getPost()
    const res = await POST(makeRequest('not-json'))
    expect(res.status).toBe(400)
    expect(await res.json()).toEqual({ error: 'invalid_email' })
    expect(listMock).not.toHaveBeenCalled()
  })

  it('returns 400 for non-email value', async () => {
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'not-an-email' }))
    expect(res.status).toBe(400)
  })

  it('returns 400 for missing email field', async () => {
    const POST = await getPost()
    const res = await POST(makeRequest({}))
    expect(res.status).toBe(400)
  })

  it('returns 400 for extra properties (strict schema)', async () => {
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'a@b.com', other: 'x' }))
    expect(res.status).toBe(400)
  })
})

// === Happy path ===
describe('Happy path (customer exists)', () => {
  it('calls customers.list with lowercased email, creates session, sends Resend email, returns 200', async () => {
    listMock.mockResolvedValueOnce({
      result: { items: [fakeCustomer()], pagination: { total_count: 1, max_page: 1 } },
    })
    createMock.mockResolvedValueOnce(fakeSession())

    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'User@Example.COM' }))

    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true })
    expect(listMock).toHaveBeenCalledWith({ email: 'user@example.com', limit: 1 })
    expect(createMock).toHaveBeenCalledWith({
      customerId: 'cust_abc',
      returnUrl: 'https://usertourkit.com/account',
    })
    expect(sendMock).toHaveBeenCalledTimes(1)
    const sendArg = sendMock.mock.calls[0][0]
    expect(sendArg.to).toBe('user@example.com')
    expect(sendArg.text).toContain('https://polar.sh/portal/cs_1')
  })

  it('passes returnUrl exactly as https://usertourkit.com/account', async () => {
    listMock.mockResolvedValueOnce({
      result: { items: [fakeCustomer()], pagination: { total_count: 1, max_page: 1 } },
    })
    createMock.mockResolvedValueOnce(fakeSession())
    const POST = await getPost()
    await POST(makeRequest({ email: 'a@b.com' }))
    expect(createMock.mock.calls[0][0].returnUrl).toBe('https://usertourkit.com/account')
  })
})

// === Customer not found ===
describe('Customer not found (enumeration mitigation)', () => {
  it('returns 200 { sent: true } and does NOT create a session or send email', async () => {
    listMock.mockResolvedValueOnce({
      result: { items: [], pagination: { total_count: 0, max_page: 1 } },
    })
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'missing@example.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true })
    expect(createMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })
})

// === SDK errors ===
describe('Polar SDK failure', () => {
  it('swallows customers.list throw, returns 200, logs console.error', async () => {
    listMock.mockRejectedValueOnce(new Error('network'))
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true })
    expect(errorSpy).toHaveBeenCalledWith('[portal] polar error', expect.any(Error))
    expect(createMock).not.toHaveBeenCalled()
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('swallows customerSessions.create throw, returns 200', async () => {
    listMock.mockResolvedValueOnce({
      result: { items: [fakeCustomer()], pagination: { total_count: 1, max_page: 1 } },
    })
    createMock.mockRejectedValueOnce(new Error('session boom'))
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(errorSpy).toHaveBeenCalledWith('[portal] polar error', expect.any(Error))
    expect(sendMock).not.toHaveBeenCalled()
  })
})

// === Resend ===
describe('Resend delivery', () => {
  it('returns 200 when Resend responds with error object (does not poison response)', async () => {
    listMock.mockResolvedValueOnce({
      result: { items: [fakeCustomer()], pagination: { total_count: 1, max_page: 1 } },
    })
    createMock.mockResolvedValueOnce(fakeSession())
    sendMock.mockResolvedValueOnce({
      data: null,
      error: { message: 'boom', name: 'validation_error' },
    })
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true })
    expect(errorSpy).toHaveBeenCalledWith('[portal] resend error', expect.any(Object))
  })

  it('skips Resend call when RESEND_API_KEY is unset, still returns 200', async () => {
    vi.unstubAllEnvs()
    vi.stubEnv('POLAR_ACCESS_TOKEN', 'polar_oat_test')
    listMock.mockResolvedValueOnce({
      result: { items: [fakeCustomer()], pagination: { total_count: 1, max_page: 1 } },
    })
    createMock.mockResolvedValueOnce(fakeSession())
    const POST = await getPost()
    const res = await POST(makeRequest({ email: 'a@b.com' }))
    expect(res.status).toBe(200)
    expect(await res.json()).toEqual({ sent: true })
    expect(sendMock).not.toHaveBeenCalled()
  })
})

// === Rate limiting ===
describe('Rate limiting', () => {
  it('returns 429 on the 6th request for the same email within the window', async () => {
    listMock.mockResolvedValue({
      result: { items: [], pagination: { total_count: 0, max_page: 1 } },
    })
    const POST = await getPost()
    for (let i = 0; i < 5; i++) {
      const res = await POST(makeRequest({ email: 'rl@example.com' }))
      expect(res.status).toBe(200)
    }
    const res6 = await POST(makeRequest({ email: 'rl@example.com' }))
    expect(res6.status).toBe(429)
    expect(await res6.json()).toEqual({ error: 'rate_limited' })
  })

  it('tracks rate limit per email (different email still allowed)', async () => {
    listMock.mockResolvedValue({
      result: { items: [], pagination: { total_count: 0, max_page: 1 } },
    })
    const POST = await getPost()
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ email: 'a@example.com' }))
    }
    const blocked = await POST(makeRequest({ email: 'a@example.com' }))
    expect(blocked.status).toBe(429)
    const other = await POST(makeRequest({ email: 'b@example.com' }))
    expect(other.status).toBe(200)
  })

  it('buckets emails case-insensitively', async () => {
    listMock.mockResolvedValue({
      result: { items: [], pagination: { total_count: 0, max_page: 1 } },
    })
    const POST = await getPost()
    for (let i = 0; i < 5; i++) {
      await POST(makeRequest({ email: 'Mixed@Case.COM' }))
    }
    const res = await POST(makeRequest({ email: 'mixed@case.com' }))
    expect(res.status).toBe(429)
  })
})

// === Module exports ===
describe('Module exports', () => {
  it('exports only POST and runtime', async () => {
    const mod = await import('../route')
    expect(mod.POST).toBeDefined()
    expect(mod.runtime).toBe('nodejs')
    expect((mod as Record<string, unknown>).GET).toBeUndefined()
    expect((mod as Record<string, unknown>).PUT).toBeUndefined()
    expect((mod as Record<string, unknown>).DELETE).toBeUndefined()
  })
})
