---
title: "Wiring Stripe Billing webhooks to contextual upgrade tours in React"
published: false
description: "Most SaaS apps treat billing and UX as separate systems. Here's how to connect Stripe webhook events to in-app product tours that fire at the right moment."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours
cover_image: https://usertourkit.com/og-images/tour-kit-stripe-billing-upgrade-tours.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)*

Most SaaS apps treat billing and product experience as two separate systems. Stripe handles the money. Your frontend handles the UI. The gap between them is where upgrade prompts go to die.

The fix is event-driven upgrade tours. Stripe already knows when a trial is ending, when a payment fails, when a user downgrades. It broadcasts these moments as webhook events. Tour Kit can listen and respond with contextual, in-app guidance at exactly the right second.

We built this integration for a B2B dashboard and hit three gotchas worth documenting.

```bash
npm install @tourkit/core @tourkit/react stripe
```

## Why Stripe webhooks + Tour Kit?

Stripe Billing processes 200M+ active subscriptions (2026). Its webhook system delivers events with 99.99% reliability. That makes it a dependable trigger source for in-app experiences.

Contextual upgrade prompts shown after a user experiences value convert at 2.3x the rate of random CTAs (Appcues). Mixpanel reported a 32% increase in plan upgrades from event-driven prompts.

## The event-to-tour mapping

| Stripe event | Tour type | User intent |
|---|---|---|
| `customer.subscription.trial_will_end` | Trial expiry upgrade | Convert trial to paid |
| `invoice.payment_failed` | Payment recovery | Update payment method |
| `customer.subscription.updated` | Plan change confirmation | Show new features / retention |
| `invoice.paid` | New feature celebration | Highlight newly available features |

Three events cover 80% of the value: `trial_will_end`, `payment_failed`, and custom "feature limit reached" events from your own backend.

## The three gotchas

**Gotcha 1: Server-to-client bridge.** Stripe sends webhooks to your server, not your client. You need a bridge — SSE, WebSocket, or simple polling every 30 seconds. We used polling.

**Gotcha 2: Event collision.** Stripe can fire several events at once (subscription update triggers both `customer.subscription.updated` and `invoice.paid`). Show one tour at a time, queue the rest.

**Gotcha 3: Context provider ordering.** The polling hook uses `useTour()` internally, so it must render inside `TourProvider`. We initially placed it above the provider and got a missing context crash.

## The webhook handler

```typescript
// src/app/api/webhooks/stripe/route.ts
import { type NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

const TOUR_TRIGGER_EVENTS = new Set([
  'customer.subscription.trial_will_end',
  'invoice.payment_failed',
  'customer.subscription.updated',
  'invoice.paid',
])

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  if (TOUR_TRIGGER_EVENTS.has(event.type)) {
    const obj = event.data.object as Record<string, unknown>
    if (typeof obj.customer === 'string') {
      await storeTourTrigger(obj.customer, event.type)
    }
  }

  return NextResponse.json({ received: true })
}
```

## Going further

- **Feature-limit tours** — fire custom events from your entitlement logic. 2.3x conversion vs generic banners.
- **Payment recovery tours** — in-app guidance reduces involuntary churn by 20-30% vs email-only dunning.
- **Downgrade prevention** — show usage stats for features about to be lost.

One limitation: Tour Kit doesn't have a visual builder and requires React 18+ with TypeScript. Every tour is hand-written JSX. For teams without React developers, a no-code tool may be a better fit.

Full article with all code examples: [usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)

---

Get started: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/domidex01/tour-kit) | `npm install @tourkit/core @tourkit/react`
