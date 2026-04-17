## Title: Wiring Stripe Billing webhooks to contextual upgrade tours in React

## URL: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

## Comment to post immediately after:

This is a tutorial on connecting Stripe webhook events to in-app product tours in a Next.js app. The integration uses Tour Kit, a headless React tour library I built (under 8KB gzipped core).

The architecture:

Stripe sends webhook events (`trial_will_end`, `payment_failed`, `subscription.updated`, `invoice.paid`) to a Next.js API route. The handler verifies the signature, extracts the customer ID, and stores a tour trigger in your database. The client polls every 30 seconds for pending triggers and calls `startTour()` when it finds one. An acknowledgment endpoint prevents duplicate tours.

Three technical findings worth noting:

1. Stripe can send multiple events in quick succession (a subscription update fires both `customer.subscription.updated` and `invoice.paid`). You need to dequeue one tour at a time and queue the rest for subsequent page loads.

2. The polling approach works because billing tours don't need millisecond delivery. SSE adds complexity without meaningful UX improvement for this use case.

3. Personalized tour content (referencing the user's actual usage: "You've used 847 API calls this month") makes a measurable difference. Mixpanel reported a 32% increase in plan upgrades when teams switched from static banners to event-driven prompts. Baremetrics documented 20-30% involuntary churn reduction from in-app payment recovery vs. email-only dunning.

The limitation: Tour Kit has no visual builder. Every tour is hand-written JSX. That's the tradeoff for full design control and a sub-8KB bundle.

Full disclosure: I built Tour Kit.

**Best posting time:** Tuesday-Thursday, 8-10 AM EST
