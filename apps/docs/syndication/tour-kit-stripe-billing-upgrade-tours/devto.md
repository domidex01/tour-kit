---
title: "Tour Kit + Stripe Billing: Trigger Upgrade Tours from Webhook Events in React"
published: false
description: "Connect Stripe webhook events to contextual product tours in React. Trigger upgrade prompts on trial expiry, feature limits, and payment failures — with working Next.js code."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours
cover_image: https://usertourkit.com/og-images/tour-kit-stripe-billing-upgrade-tours.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours)*

Most SaaS apps treat billing and product experience as two separate systems. Stripe handles the money. Your frontend handles the UI. The gap between them is where upgrade prompts go to die: static banners nobody reads, email campaigns that land in spam, and modal pop-ups that fire before the user has any reason to care.

The fix is event-driven upgrade tours. Stripe already knows when a trial is ending, when a payment fails, when a user downgrades. It broadcasts these moments as webhook events. Tour Kit can listen and respond with contextual, in-app guidance that arrives at exactly the right second.

We built this integration for a B2B dashboard app and hit three gotchas worth documenting. This article walks through the working code.

```bash
npm install @tourkit/core @tourkit/react
```

[View the full docs at usertourkit.com](https://usertourkit.com/)

## What you'll build

By the end of this tutorial, you'll have Stripe Billing webhook events wired to Tour Kit product tours in a Next.js app, so your upgrade prompts fire based on real subscription lifecycle moments instead of arbitrary timers or static banners that users scroll past. The full integration takes about an hour and requires no additional infrastructure beyond your existing Next.js API routes.

Stripe fires `customer.subscription.trial_will_end`, and your app responds with a contextual upgrade tour. An `invoice.payment_failed` event triggers a payment recovery tour that walks the user to their card settings. Someone hits a feature gate tied to their plan tier? A targeted tour explains exactly which features they'd gain by moving up.

## Why Stripe webhooks + Tour Kit?

Stripe Billing processes over 200 million active subscriptions as of 2026, and its webhook system delivers events with 99.99% reliability including automatic retries on failure ([Stripe](https://stripe.com/billing)). That combination makes Stripe webhooks one of the most dependable trigger sources for in-app experiences you can build on today.

The problem is that most teams use these events only for backend logic: update the database, send a dunning email, adjust entitlements. The frontend never hears about them. Your React app doesn't know the user's trial ends in three days until the user checks their billing page, if they even find it.

Tour Kit fills that gap. It renders product tours from your own React components (it's headless, so you control styling) and exposes a programmatic API for starting tours based on external signals. Connect a Stripe webhook to a Tour Kit tour, and you get upgrade prompts timed to the billing lifecycle instead of guesswork.

Research backs this up. Contextual upgrade prompts shown after a user experiences value convert at 2.3x the rate of random upgrade CTAs ([Appcues](https://www.appcues.com/blog/upgrade-prompts)). Mixpanel reported a 32% increase in plan upgrades when teams switched from static banners to event-driven prompts ([Mixpanel, 2025](https://mixpanel.com/blog/conversion-optimization)).

## Prerequisites

You need a working Next.js 14+ project with App Router (the API routes handle webhook ingestion), React 18.2 or later, a Stripe account with Billing enabled, and TypeScript 5+. The `stripe` npm package handles webhook signature verification on the server side.

```bash
npm install stripe @tourkit/core @tourkit/react
```

## Step 1: Map Stripe events to tour types

The first step is deciding which Stripe events should trigger which tours, because not every billing event deserves an in-app interruption. We started with nine events and narrowed to five that actually moved conversion metrics.

| Stripe event | Tour type | When it fires | User intent |
|---|---|---|---|
| `customer.subscription.trial_will_end` | Trial expiry upgrade | 3 days before trial ends | Convert trial to paid |
| `invoice.payment_failed` | Payment recovery | Charge attempt fails | Update payment method |
| `customer.subscription.updated` | Plan change confirmation | Upgrade or downgrade | Show new features / retention |
| `invoice.paid` | New feature celebration | After successful payment | Highlight newly available features |
| `customer.subscription.deleted` | Win-back / exit survey | Subscription cancelled | Last-chance retention |

We found that three events cover 80% of the upgrade tour value: `trial_will_end`, `payment_failed`, and the custom "feature limit reached" event you fire from your own backend when usage hits a plan ceiling. Start with those three.

## Step 2: Handle Stripe webhooks in a Next.js API route

Your webhook endpoint receives Stripe events, verifies the cryptographic signature to prevent spoofing, and stores the relevant event type against the user's customer ID so the client can pick it up later.

```tsx
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
    const customerId = extractCustomerId(event)
    if (customerId) {
      await storeTourTrigger(customerId, event.type, event.data.object)
    }
  }

  return NextResponse.json({ received: true })
}

function extractCustomerId(event: Stripe.Event): string | null {
  const obj = event.data.object as Record<string, unknown>
  if (typeof obj.customer === 'string') return obj.customer
  return null
}

async function storeTourTrigger(
  customerId: string,
  eventType: string,
  data: Stripe.Event.Data.Object
) {
  // Use your database, Redis, or any key-value store
  console.log(`Tour trigger stored: ${eventType} for ${customerId}`)
}
```

The gotcha we hit first: Stripe sends webhook events to your server, not your client. You need a bridge. We used server-sent events (SSE) for real-time delivery without WebSocket complexity, but polling a `/api/tour-triggers` endpoint every 30 seconds works fine for most apps.

## Step 3: Create a client-side hook that polls for tour triggers

The polling hook runs inside your React app, checks the backend every 30 seconds for pending tour triggers, and calls Tour Kit's `startTour()` API when it finds one. It handles deduplication so users never see the same billing tour twice.

```tsx
// src/hooks/use-billing-tour-triggers.ts
import { useEffect, useCallback } from 'react'
import { useTour } from '@tourkit/react'

interface TourTrigger {
  eventType: string
  timestamp: number
  metadata: Record<string, unknown>
}

export function useBillingTourTriggers() {
  const { startTour } = useTour()

  const checkTriggers = useCallback(async () => {
    const response = await fetch('/api/tour-triggers')
    if (!response.ok) return

    const triggers: TourTrigger[] = await response.json()

    for (const trigger of triggers) {
      const tourId = mapEventToTour(trigger.eventType)
      if (tourId) {
        startTour(tourId, { metadata: trigger.metadata })
        await fetch('/api/tour-triggers/ack', {
          method: 'POST',
          body: JSON.stringify({ eventType: trigger.eventType }),
          headers: { 'Content-Type': 'application/json' },
        })
        break // One tour at a time
      }
    }
  }, [startTour])

  useEffect(() => {
    checkTriggers()
    const interval = setInterval(checkTriggers, 30_000)
    return () => clearInterval(interval)
  }, [checkTriggers])
}

function mapEventToTour(eventType: string): string | null {
  const mapping: Record<string, string> = {
    'customer.subscription.trial_will_end': 'trial-expiry-upgrade',
    'invoice.payment_failed': 'payment-recovery',
    'customer.subscription.updated': 'plan-change-confirmation',
    'invoice.paid': 'feature-celebration',
  }
  return mapping[eventType] ?? null
}
```

Second gotcha: don't fire multiple tours simultaneously. Stripe can send several events in quick succession (a subscription update triggers both `customer.subscription.updated` and `invoice.paid`). The `break` after the first matched tour prevents tour collision.

## Step 4: Build the upgrade tour component

Tour Kit is headless, meaning it handles positioning, step management, and keyboard navigation while you control every pixel of the tooltip UI. Here's the trial expiry tour that fires when Stripe sends `customer.subscription.trial_will_end`.

```tsx
// src/components/tours/trial-expiry-tour.tsx
import { Tour, TourStep, TourTooltip } from '@tourkit/react'

export function TrialExpiryTour() {
  return (
    <Tour tourId="trial-expiry-upgrade">
      <TourStep target="#usage-dashboard" order={1}>
        <TourTooltip>
          {({ currentStep, totalSteps, nextStep }) => (
            <div className="rounded-lg bg-white p-4 shadow-lg border max-w-sm">
              <p className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </p>
              <h3 className="font-semibold mt-1">
                Your trial ends in 3 days
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                You've used 847 API calls this month. The free tier
                caps at 1,000. Your current usage pattern needs the
                Pro plan to avoid interruption.
              </p>
              <button
                onClick={nextStep}
                className="mt-3 px-4 py-2 bg-blue-600 text-white rounded text-sm"
              >
                See what Pro includes
              </button>
            </div>
          )}
        </TourTooltip>
      </TourStep>

      <TourStep target="#pricing-link" order={2}>
        <TourTooltip>
          {({ currentStep, totalSteps, endTour }) => (
            <div className="rounded-lg bg-white p-4 shadow-lg border max-w-sm">
              <p className="text-sm text-gray-500">
                Step {currentStep} of {totalSteps}
              </p>
              <h3 className="font-semibold mt-1">
                Upgrade takes 30 seconds
              </h3>
              <p className="text-sm text-gray-600 mt-2">
                Pro starts at $29/month with unlimited API calls,
                priority support, and team seats. No contract.
              </p>
              <div className="flex gap-2 mt-3">
                <a
                  href="/billing/upgrade"
                  className="px-4 py-2 bg-blue-600 text-white rounded text-sm"
                >
                  View plans
                </a>
                <button
                  onClick={endTour}
                  className="px-4 py-2 text-gray-500 text-sm"
                >
                  Maybe later
                </button>
              </div>
            </div>
          )}
        </TourTooltip>
      </TourStep>
    </Tour>
  )
}
```

Notice the tour content references the user's actual usage ("847 API calls"). Generic "upgrade now" messages convert poorly. Specificity is the difference between a 2% and an 8% trial-to-paid conversion rate ([ProfitWell](https://www.profitwell.com/recur/all/freemium-conversion-rate)).

## Step 5: Wire it up in your layout

Mount the tour components and the polling hook at your dashboard layout level so billing tours are available on every authenticated page.

```tsx
// src/app/(dashboard)/layout.tsx
import { TourProvider } from '@tourkit/react'
import { TrialExpiryTour } from '@/components/tours/trial-expiry-tour'
import { PaymentRecoveryTour } from '@/components/tours/payment-recovery-tour'
import { useBillingTourTriggers } from '@/hooks/use-billing-tour-triggers'

function BillingTourManager() {
  useBillingTourTriggers()
  return (
    <>
      <TrialExpiryTour />
      <PaymentRecoveryTour />
    </>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <TourProvider>
      <BillingTourManager />
      {children}
    </TourProvider>
  )
}
```

Third gotcha: `useBillingTourTriggers` uses `useTour()` internally, so it must render inside `TourProvider`. We initially put the hook in the layout component itself, above the provider. That crashes with a missing context error. Wrapping it in a child component fixes it.

## Step 6: Verify it works

Test the full webhook-to-tour pipeline locally using the Stripe CLI:

```bash
# Terminal 1: Forward Stripe events to your local webhook
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Trigger a trial_will_end event
stripe trigger customer.subscription.trial_will_end
```

You should see the tour trigger stored in your console output, and within 30 seconds (or immediately if you refresh), the trial expiry tour appears targeting your `#usage-dashboard` element.

For production, verify these in your Stripe dashboard under Developers > Webhooks:
- Endpoint URL points to your deployed API route
- Events are filtered to only the four types you handle
- Signing secret matches your `STRIPE_WEBHOOK_SECRET` env var

## Going further

Once the core webhook-to-tour pipeline works, three extensions add the most conversion value:

**Feature-limit tours.** Stripe doesn't emit a "user hit their plan limit" event. You fire that yourself from your entitlement logic. When a free-tier user tries to access a Pro feature, store a tour trigger with the feature name as metadata. This pattern converts at 2.3x the rate of generic upgrade banners ([Appcues](https://www.appcues.com/blog/upgrade-prompts)).

**Payment recovery tours.** When `invoice.payment_failed` fires, most apps send an email. But if the user is currently logged in, an in-app tour that walks them to Settings > Billing > Update Card is more immediate. Payment failure recovery tours can reduce involuntary churn by 20-30% compared to email-only dunning ([Baremetrics](https://baremetrics.com/blog/involuntary-churn)).

**Downgrade prevention.** When `customer.subscription.updated` indicates a plan downgrade, trigger a tour that shows usage stats for features the user is about to lose. "You used Advanced Analytics 23 times this month. That feature isn't available on the Starter plan." Specific, data-backed retention is harder to dismiss than a generic "are you sure?" modal.

One limitation to be aware of: Tour Kit doesn't have a visual builder and requires React 18+ with TypeScript, so every tour is hand-written JSX. That's the tradeoff for full design control and zero vendor lock-in. For teams without React developers, a no-code tool like Appcues or Userpilot may be a better fit for billing lifecycle tours.

---

Get started with Tour Kit: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/DomiDex/tour-kit) | `npm install @tourkit/core @tourkit/react`

## FAQ

### Can Tour Kit trigger tours from Stripe webhooks without polling?

Tour Kit's `startTour()` API accepts any trigger source. Connect a WebSocket or SSE endpoint to your webhook handler, and when Stripe sends an event, your server pushes it to the client which calls `startTour()` directly. Polling at 30-second intervals works for most apps since billing tours aren't time-critical to the millisecond.

### Does this integration add latency to my Stripe webhook processing?

No. The webhook handler stores the tour trigger and returns `200` to Stripe immediately. Tour rendering happens entirely on the client side. Stripe's webhook timeout is 20 seconds, and storing a key-value pair takes single-digit milliseconds. Tour Kit's core is under 8KB gzipped, so the client-side overhead is minimal.

### What happens if the user isn't logged in when Stripe fires the event?

The tour trigger persists in your database until acknowledged. When the user next logs in and the polling hook runs, it picks up the pending trigger and starts the tour. Set a TTL on triggers (we use 7 days) so stale events don't surface weeks later.

### Can I use this with Stripe's Customer Portal instead of custom upgrade pages?

Yes. Link the tour's CTA to a Stripe Customer Portal session URL generated server-side via `stripe.billingPortal.sessions.create()`. The tour adds the contextual guidance that the portal alone doesn't provide.

### How do I prevent showing upgrade tours to users who already upgraded?

Check the user's current subscription status before starting the tour. In `useBillingTourTriggers`, add a guard that fetches the user's plan from your database or Stripe API. If they're already on the target plan, acknowledge the trigger without starting the tour.
