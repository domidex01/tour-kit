## Subject: Tutorial — Wiring Stripe Billing webhooks to in-app upgrade tours in React

## Recipients:
- **Cooperpress** (React Status, JavaScript Weekly): editor@cooperpress.com
- **This Week in React**: sebastien@thisweekinreact.com
- **Bytes.dev**: submit via their site

---

## Email body (Cooperpress):

Hi,

I wrote a step-by-step tutorial on connecting Stripe Billing webhook events to contextual product tours in a Next.js app using Tour Kit (headless React tour library, under 8KB gzipped).

The interesting pattern: Stripe already knows when a trial is ending, a payment fails, or a user downgrades. The tutorial shows how to bridge those server-side webhook events to client-side tour triggers via polling, with deduplication and acknowledgment.

Key data points:
- Contextual upgrade prompts convert at 2.3x the rate of static banners (Appcues research)
- 32% increase in plan upgrades with event-driven prompts vs. static (Mixpanel, 2025)
- 20-30% involuntary churn reduction from in-app payment recovery tours vs. email dunning (Baremetrics)

Full Next.js code: webhook handler, polling hook, headless tour component, and Stripe CLI testing setup.

Link: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

Disclosure: I built Tour Kit. The Stripe webhook integration pattern applies to any tour library.

Thanks,
Domi

---

## Email body (This Week in React):

Hi Sebastien,

Wrote a tutorial on connecting Stripe Billing webhooks to in-app product tours in React that covers a pattern your readers might find useful:

1. Next.js API route receives Stripe events, verifies signature, stores tour triggers
2. Client-side React hook polls for triggers and calls `startTour()` with metadata
3. Headless tour component renders personalized upgrade prompts (usage-specific, not generic)

Three gotchas documented: webhook-to-client bridge (polling vs. SSE), multi-event deduplication (Stripe fires several events simultaneously), and provider placement (`useTour()` must render inside `TourProvider`).

The tutorial uses Tour Kit (a headless library I built), but the webhook-to-tour architecture applies generally. Stripe processes 200M+ active subscriptions, so this is a common integration need.

Link: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

Thanks,
Domi

---

## Email body (Bytes.dev):

Tutorial on wiring Stripe Billing webhooks to in-app upgrade tours in React/Next.js. Stripe fires `trial_will_end` or `payment_failed`, your app responds with a contextual product tour instead of a static banner. 2.3x conversion lift over random upgrade CTAs. Full working code with webhook handler, polling hook, and headless tour components.

Link: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours
