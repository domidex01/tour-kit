import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// --- Mock state ---
let mockBehavior: 'valid' | 'invalid-sig' | 'stale' | 'malformed' = 'valid'

vi.mock('@polar-sh/nextjs', () => ({
  Webhooks: vi.fn(
    (config: {
      webhookSecret: string
      onPayload: (payload: unknown) => Promise<void>
    }) => {
      return async (req: Request): Promise<Response> => {
        if (mockBehavior === 'invalid-sig') {
          return new Response('Invalid signature', { status: 403 })
        }
        if (mockBehavior === 'stale') {
          return new Response('Stale timestamp', { status: 403 })
        }
        if (mockBehavior === 'malformed') {
          return new Response('Bad request', { status: 400 })
        }

        const body = await req.clone().json()
        await config.onPayload(body)
        return new Response(JSON.stringify({ received: true }), {
          status: 200,
          headers: { 'content-type': 'application/json' },
        })
      }
    }
  ),
}))

// --- Helpers ---
function simulateValidSignature() {
  mockBehavior = 'valid'
}
function simulateInvalidSignature() {
  mockBehavior = 'invalid-sig'
}
function simulateStaleTimestamp() {
  mockBehavior = 'stale'
}
function simulateMalformedBody() {
  mockBehavior = 'malformed'
}

function makeBenefitGrantPayload(
  type: 'benefit_grant.created' | 'benefit_grant.updated' | 'benefit_grant.revoked'
) {
  return {
    type,
    data: {
      id: 'bg_test123',
      benefit_id: 'ben_tourkit_pro',
      customer_id: 'cust_abc456',
      benefit: {
        id: 'ben_tourkit_pro',
        type: 'license_keys',
        description: 'userTourKit Pro License',
      },
      granted_at: new Date().toISOString(),
    },
  }
}

function createWebhookRequest(overrides?: {
  webhookId?: string
  webhookTimestamp?: string
  webhookSignature?: string
  body?: Record<string, unknown>
}) {
  const body = overrides?.body ?? makeBenefitGrantPayload('benefit_grant.created')
  const now = Math.floor(Date.now() / 1000)

  return new Request('http://localhost:3000/api/webhooks/polar', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'webhook-id': overrides?.webhookId ?? `wh_${crypto.randomUUID()}`,
      'webhook-timestamp': overrides?.webhookTimestamp ?? String(now),
      'webhook-signature': overrides?.webhookSignature ?? 'v1,validbase64sig==',
    },
    body: JSON.stringify(body),
  }) as unknown as import('next/server').NextRequest
}

// --- Test setup ---
let consoleSpy: ReturnType<typeof vi.spyOn>

beforeEach(async () => {
  vi.stubEnv('POLAR_WEBHOOK_SECRET', 'whsec_test_placeholder_not_real')
  consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
  simulateValidSignature()

  // Reset module to clear the idempotency map
  vi.resetModules()
})

afterEach(() => {
  vi.unstubAllEnvs()
  vi.restoreAllMocks()
})

// Helper to get a fresh POST handler (after resetModules)
async function getPostHandler() {
  const mod = await import('../route')
  return mod.POST
}

// === Section A: Signature Verification ===

describe('Signature verification', () => {
  it('calls onPayload and returns 202 for valid signature', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest()
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
  })

  it('returns 403 for invalid signature without calling onPayload', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({ webhookSignature: 'v1,invalidsig==' })
    simulateInvalidSignature()
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('returns 403 when webhook-signature header is missing', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({ webhookSignature: '' })
    simulateInvalidSignature()
    const res = await POST(req)
    expect(res.status).toBe(403)
  })
})

// === Section B: Stale Timestamp Rejection ===

describe('Stale timestamp rejection', () => {
  it('returns 403 for webhook-timestamp older than 5 minutes', async () => {
    const POST = await getPostHandler()
    const staleTimestamp = String(Math.floor(Date.now() / 1000) - 6 * 60)
    const req = createWebhookRequest({ webhookTimestamp: staleTimestamp })
    simulateStaleTimestamp()
    const res = await POST(req)
    expect(res.status).toBe(403)
  })

  it('accepts webhook-timestamp within 5-minute window', async () => {
    const POST = await getPostHandler()
    const freshTimestamp = String(Math.floor(Date.now() / 1000) - 2 * 60)
    const req = createWebhookRequest({ webhookTimestamp: freshTimestamp })
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
  })
})

// === Section C: Idempotency ===

describe('Idempotency', () => {
  it('processes the first request with a given webhook-id', async () => {
    const POST = await getPostHandler()
    const webhookId = 'wh_dedup_test_001'
    const req = createWebhookRequest({ webhookId })
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[polar-webhook]',
      expect.objectContaining({ type: 'benefit_grant.created' })
    )
  })

  it('returns 202 without re-processing for duplicate webhook-id', async () => {
    const POST = await getPostHandler()
    const webhookId = 'wh_dedup_test_002'
    simulateValidSignature()

    // First call
    const req1 = createWebhookRequest({ webhookId })
    await POST(req1)
    consoleSpy.mockClear()

    // Second call — same webhook-id
    const req2 = createWebhookRequest({ webhookId })
    const res = await POST(req2)
    expect(res.status).toBe(202)
    expect(consoleSpy).not.toHaveBeenCalledWith(
      '[polar-webhook]',
      expect.objectContaining({ type: 'benefit_grant.created' })
    )
  })

  it('still processes valid request after invalid-sig request with same webhook-id', async () => {
    const POST = await getPostHandler()
    const webhookId = 'wh_poison_test'

    // Attacker sends request with valid webhook-id but invalid signature
    simulateInvalidSignature()
    const poisonReq = createWebhookRequest({ webhookId })
    const poisonRes = await POST(poisonReq)
    expect(poisonRes.status).toBe(403)

    // Real Polar retry with same webhook-id and valid signature
    simulateValidSignature()
    const realReq = createWebhookRequest({ webhookId })
    const realRes = await POST(realReq)
    expect(realRes.status).toBe(202)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[polar-webhook]',
      expect.objectContaining({ type: 'benefit_grant.created' })
    )
  })

  it('re-processes after TTL expiry', async () => {
    vi.useFakeTimers()
    const POST = await getPostHandler()
    const webhookId = 'wh_dedup_test_003'
    simulateValidSignature()

    const req1 = createWebhookRequest({ webhookId })
    await POST(req1)
    consoleSpy.mockClear()

    // Advance past 10-minute TTL
    vi.advanceTimersByTime(11 * 60 * 1000)

    const req2 = createWebhookRequest({ webhookId })
    const res = await POST(req2)
    expect(res.status).toBe(202)
    expect(consoleSpy).toHaveBeenCalledWith(
      '[polar-webhook]',
      expect.objectContaining({ type: 'benefit_grant.created' })
    )

    vi.useRealTimers()
  })
})

// === Section D: Event Type Handling ===

describe('Event type handling', () => {
  it.each(['benefit_grant.created', 'benefit_grant.updated', 'benefit_grant.revoked'] as const)(
    'handles %s event and logs structured data',
    async (eventType) => {
      const POST = await getPostHandler()
      const payload = makeBenefitGrantPayload(eventType)
      const req = createWebhookRequest({ body: payload })
      simulateValidSignature()

      const res = await POST(req)
      expect(res.status).toBe(202)
      expect(consoleSpy).toHaveBeenCalledWith(
        '[polar-webhook]',
        expect.objectContaining({
          type: eventType,
          benefit_id: 'ben_tourkit_pro',
          customer_id: 'cust_abc456',
        })
      )
    }
  )

  it('handles unknown event type gracefully without crashing', async () => {
    const POST = await getPostHandler()
    const payload = { type: 'order.created', data: { id: 'ord_123' } }
    const req = createWebhookRequest({ body: payload })
    simulateValidSignature()

    const res = await POST(req)
    expect(res.status).toBe(202)
  })
})

// === Section E: Structured Logging ===

describe('Structured logging', () => {
  it('logs [polar-webhook] prefix with structured payload fields', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({
      body: makeBenefitGrantPayload('benefit_grant.created'),
    })
    simulateValidSignature()
    await POST(req)

    expect(consoleSpy).toHaveBeenCalledWith(
      '[polar-webhook]',
      expect.objectContaining({
        type: 'benefit_grant.created',
        benefit_id: expect.any(String),
        customer_id: expect.any(String),
        timestamp: expect.any(String),
      })
    )
  })

  it('does not log payload on duplicate webhook-id', async () => {
    const POST = await getPostHandler()
    const webhookId = 'wh_log_dedup'
    simulateValidSignature()

    await POST(createWebhookRequest({ webhookId }))
    consoleSpy.mockClear()

    await POST(createWebhookRequest({ webhookId }))
    expect(consoleSpy).not.toHaveBeenCalledWith('[polar-webhook]', expect.anything())
  })
})

// === Section F: Malformed Payload Handling ===

describe('Malformed payload handling', () => {
  it('handles empty body without crashing', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({ body: {} })
    simulateMalformedBody()
    const res = await POST(req)
    expect([400, 403]).toContain(res.status)
  })

  it('handles payload with missing type field gracefully', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({
      body: { data: { id: 'test' } },
    })
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
  })

  it('handles payload with missing data field gracefully', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest({
      body: { type: 'benefit_grant.created' },
    })
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
  })
})

// === Section G: HTTP Method and Response ===

describe('HTTP method and response', () => {
  it('returns 202 (not 200) on successful webhook', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest()
    simulateValidSignature()
    const res = await POST(req)
    expect(res.status).toBe(202)
    expect(res.status).not.toBe(200)
  })

  it('exports only POST handler from route module', async () => {
    const routeModule = await import('../route')
    expect(routeModule.POST).toBeDefined()
    expect((routeModule as Record<string, unknown>).GET).toBeUndefined()
    expect((routeModule as Record<string, unknown>).PUT).toBeUndefined()
    expect((routeModule as Record<string, unknown>).DELETE).toBeUndefined()
  })
})

// === Section H: Response Time ===

describe('Response time', () => {
  it('responds within 2 seconds', async () => {
    const POST = await getPostHandler()
    const req = createWebhookRequest()
    simulateValidSignature()
    const start = performance.now()
    await POST(req)
    const elapsed = performance.now() - start
    expect(elapsed).toBeLessThan(2000)
  })
})
