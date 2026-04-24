// SDK shape verified against
// node_modules/@polar-sh/sdk/dist/esm/models/operations/customersessionscreate.d.ts:
// customerSessions.create accepts { customerId | customerExternalId, returnUrl? }.
// There is no customer_email shape — always resolve via customers.list({ email }) first.
import { Polar } from '@polar-sh/sdk'
import { Resend } from 'resend'
import { z } from 'zod'

export const runtime = 'nodejs'

const Input = z.strictObject({ email: z.email() })

const WINDOW_MS = 60 * 60 * 1000
const LIMIT = 5
const attempts = new Map<string, { count: number; resetAt: number }>()

function rateLimited(email: string): boolean {
  const now = Date.now()
  const entry = attempts.get(email)
  if (!entry || now > entry.resetAt) {
    attempts.set(email, { count: 1, resetAt: now + WINDOW_MS })
    return false
  }
  if (entry.count >= LIMIT) return true
  entry.count += 1
  return false
}

export async function POST(req: Request): Promise<Response> {
  const body = await req.json().catch(() => null)
  const parsed = Input.safeParse(body)
  if (!parsed.success) {
    return Response.json({ error: 'invalid_email' }, { status: 400 })
  }

  const email = parsed.data.email.toLowerCase().trim()
  if (rateLimited(email)) {
    return Response.json({ error: 'rate_limited' }, { status: 429 })
  }

  try {
    const polar = new Polar({ accessToken: process.env.POLAR_ACCESS_TOKEN ?? '' })
    const list = await polar.customers.list({ email, limit: 1 })
    const customer = list.result?.items?.[0]

    if (customer) {
      const session = await polar.customerSessions.create({
        customerId: customer.id,
        returnUrl: 'https://usertourkit.com/account',
      })

      const resendKey = process.env.RESEND_API_KEY
      if (resendKey) {
        const resend = new Resend(resendKey)
        const { error } = await resend.emails.send({
          from: 'Tour Kit <noreply@usertourkit.com>',
          to: email,
          subject: 'Your Tour Kit account sign-in link',
          text: `Click to manage your Tour Kit license:\n\n${session.customerPortalUrl}\n\nThis link expires on ${session.expiresAt.toISOString()}.`,
        })
        if (error) console.error('[portal] resend error', error)
      }
    }
  } catch (err) {
    console.error('[portal] polar error', err)
  }

  console.log('[portal]', { email, status: 'sent' })
  return Response.json({ sent: true })
}
