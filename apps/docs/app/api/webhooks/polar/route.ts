import { Webhooks } from "@polar-sh/nextjs";

// --- Idempotency ---
const processedWebhooks = new Map<string, number>();
const DEDUP_TTL_MS = 10 * 60 * 1000; // 10 minutes

function cleanExpired(): void {
  const now = Date.now();
  for (const [id, ts] of processedWebhooks) {
    if (now - ts > DEDUP_TTL_MS) processedWebhooks.delete(id);
  }
}

function isDuplicate(webhookId: string): boolean {
  cleanExpired();
  if (processedWebhooks.has(webhookId)) return true;
  processedWebhooks.set(webhookId, Date.now());
  return false;
}

// --- Polar webhook handler ---
const polarHandler = Webhooks({
  webhookSecret: process.env.POLAR_WEBHOOK_SECRET!,
  onPayload: async (payload) => {
    const { type, data } = payload as { type: string; data?: Record<string, unknown> };

    switch (type) {
      case "benefit_grant.created":
      case "benefit_grant.updated":
      case "benefit_grant.revoked":
        console.log("[polar-webhook]", {
          type,
          benefit_id: data?.benefit_id ?? null,
          customer_id: data?.customer_id ?? null,
          timestamp: new Date().toISOString(),
        });
        break;
      default:
        console.log("[polar-webhook]", { type, note: "unhandled event type" });
        break;
    }
  },
});

// --- Route handler (wraps Polar handler for idempotency + 202 status) ---
export async function POST(request: Request): Promise<Response> {
  const webhookId = request.headers.get("webhook-id");

  if (webhookId && isDuplicate(webhookId)) {
    return new Response(JSON.stringify({ received: true }), {
      status: 202,
      headers: { "content-type": "application/json" },
    });
  }

  const response = await polarHandler(request as any);

  // Convert 200 success to 202 Accepted (Polar documented best practice)
  if (response.status === 200) {
    const body = await response.text();
    return new Response(body, {
      status: 202,
      headers: response.headers,
    });
  }

  return response;
}
