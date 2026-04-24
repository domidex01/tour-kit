import { Webhooks } from '@polar-sh/nextjs'
import type { NextRequest } from 'next/server'
import { Resend } from 'resend'

// --- Idempotency ---
const processedWebhooks = new Map<string, number>()
const DEDUP_TTL_MS = 10 * 60 * 1000 // 10 minutes

function cleanExpired(): void {
  const now = Date.now()
  for (const [id, ts] of processedWebhooks) {
    if (now - ts > DEDUP_TTL_MS) processedWebhooks.delete(id)
  }
}

function wasSeen(webhookId: string): boolean {
  cleanExpired()
  return processedWebhooks.has(webhookId)
}

function markSeen(webhookId: string): void {
  processedWebhooks.set(webhookId, Date.now())
}

// --- Ops alerts (Resend) ---
// @polar-sh/sdk's $inboundSchema transforms Polar's wire-format snake_case into
// camelCase, so onPayload receives { customerId, benefitId }. We also fall
// back to snake_case in case a future config toggles that transform off.
let resendClient: Resend | null = null
function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY
  if (!key) return null
  resendClient ??= new Resend(key)
  return resendClient
}

function getCustomerId(data: Record<string, unknown> | undefined): string | null {
  const id = data?.customerId ?? data?.customer_id
  return typeof id === 'string' ? id : null
}

function getBenefitId(data: Record<string, unknown> | undefined): string | null {
  const id = data?.benefitId ?? data?.benefit_id
  return typeof id === 'string' ? id : null
}

async function sendOpsAlert(type: string, data: Record<string, unknown>): Promise<void> {
  try {
    const client = getResend()
    const to = process.env.OPS_ALERT_EMAIL
    if (!client || !to) return
    const customerId = getCustomerId(data) ?? 'unknown'
    const { error } = await client.emails.send({
      from: 'alerts@usertourkit.com',
      to,
      subject: `[TK] ${type}: ${customerId}`,
      text: JSON.stringify(data, null, 2),
    })
    if (error) console.error('[webhook] alert failed', error)
  } catch (e) {
    console.error('[webhook] alert failed', e)
  }
}

// --- Polar webhook handler ---
const polarHandler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET ?? '',
  onPayload: async (payload) => {
    const { type, data } = payload as { type: string; data?: Record<string, unknown> }

    switch (type) {
      case 'benefit_grant.created':
      case 'benefit_grant.updated':
      case 'benefit_grant.revoked':
        console.log('[polar-webhook]', {
          type,
          benefit_id: getBenefitId(data),
          customer_id: getCustomerId(data),
          timestamp: new Date().toISOString(),
        })
        if (type === 'benefit_grant.revoked') {
          await sendOpsAlert(type, data ?? {})
        }
        break
      case 'order.refunded':
        console.log('[polar-webhook]', {
          type,
          order_id: data?.id ?? null,
          customer_id: getCustomerId(data),
          timestamp: new Date().toISOString(),
        })
        await sendOpsAlert(type, data ?? {})
        break
      default:
        console.log('[polar-webhook]', { type, note: 'unhandled event type' })
        break
    }
  },
})

// --- Route handler (wraps Polar handler for idempotency + 202 status) ---
export async function POST(request: NextRequest): Promise<Response> {
  const webhookId = request.headers.get('webhook-id')

  // Only skip processing for IDs that previously passed validation
  if (webhookId && wasSeen(webhookId)) {
    return new Response(JSON.stringify({ received: true }), {
      status: 202,
      headers: { 'content-type': 'application/json' },
    })
  }

  const response = await polarHandler(request)

  // Only mark as seen after successful signature validation
  if (response.status === 200 && webhookId) {
    markSeen(webhookId)
  }

  // Convert 200 success to 202 Accepted (Polar documented best practice)
  if (response.status === 200) {
    const body = await response.text()
    return new Response(body, {
      status: 202,
      headers: response.headers,
    })
  }

  return response
}
