## Thread (7 tweets)

**1/** Most SaaS apps treat billing and product experience as two separate systems.

Stripe knows when a trial is ending, a payment fails, or a user downgrades. But the frontend never hears about it.

We wired Stripe webhooks to in-app upgrade tours. Here's what we learned:

**2/** The architecture is simple:

Stripe fires a webhook -> Next.js API route verifies the signature and stores a tour trigger -> React hook polls every 30s -> Tour Kit renders a contextual upgrade tour

No WebSockets needed. Billing tours don't need millisecond delivery.

**3/** Five Stripe events map to tours:

- trial_will_end -> Trial expiry upgrade
- payment_failed -> Payment recovery
- subscription.updated -> Plan change confirmation
- invoice.paid -> Feature celebration
- subscription.deleted -> Win-back

Three of these cover 80% of the conversion value.

**4/** The data backs it up:

- Contextual upgrade prompts convert at 2.3x the rate of static banners (Appcues)
- 32% more plan upgrades with event-driven prompts vs. static (Mixpanel)
- 20-30% involuntary churn reduction from in-app payment recovery vs. email dunning (Baremetrics)

**5/** Three gotchas we hit:

1. Stripe webhooks hit your server, not your client. You need a bridge (polling or SSE).
2. Stripe fires multiple events at once. Dequeue one tour at a time.
3. useTour() must render inside TourProvider. Don't put the hook above the provider in your layout.

**6/** The biggest insight: personalized tour content matters.

"You've used 847 API calls this month" converts way better than "Upgrade now!"

Specificity is the difference between a 2% and 8% trial-to-paid rate.

**7/** Full tutorial with working Next.js code — webhook handler, polling hook, headless tour component, and Stripe CLI testing:

https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

Uses Tour Kit (headless, under 8KB gzipped). The webhook pattern works with any tour library.

(Disclosure: I built Tour Kit.)
