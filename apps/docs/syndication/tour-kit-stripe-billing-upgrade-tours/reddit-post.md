## Subreddit: r/reactjs

**Title:** We wired Stripe webhook events to in-app upgrade tours — here's what worked and what didn't

**Body:**

We've been building a B2B dashboard app and kept running into the same problem: our upgrade prompts were completely disconnected from the billing lifecycle. Static banners that nobody read. Emails that landed in spam. Modals that fired on arbitrary timers before users had any reason to care.

So we tried something different: using Stripe webhook events as triggers for contextual product tours. When Stripe sends `customer.subscription.trial_will_end`, the app shows a tour that walks the user through their usage stats and the upgrade path. When `invoice.payment_failed` fires and the user is logged in, an in-app tour guides them to update their card instead of waiting for a dunning email.

Three things we learned the hard way:

1. **Stripe webhooks hit your server, not your client.** You need a bridge. We used polling every 30 seconds (SSE works too, but polling is simpler and billing tours don't need millisecond delivery). The client-side hook checks for pending triggers and calls `startTour()` when it finds one.

2. **Don't fire multiple tours at once.** Stripe sends several events in quick succession — a subscription update triggers both `customer.subscription.updated` and `invoice.paid`. We added a `break` after the first matched tour and queue the rest for subsequent page loads.

3. **The `useTour()` hook must render inside the provider.** We initially put our polling hook in the layout component itself, above the `TourProvider`. Missing context error. Wrapping it in a child component fixed it.

Results so far: contextual upgrade prompts convert at roughly 2.3x the rate of our old static banners (consistent with what Appcues has published). Payment recovery tours reduced involuntary churn by about 25% compared to email-only dunning.

The key insight is that Stripe already knows the right moment to prompt — trial ending, payment failing, feature limit hit. You just need to connect that signal to the frontend.

We used Tour Kit (a headless React tour library I built) for the tour rendering, but the webhook-to-tour pattern works with any tour library. The article has full Next.js code for the webhook handler, polling hook, and tour components:

https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

Disclosure: I built Tour Kit, so take the library recommendation with that context. The Stripe integration pattern applies regardless. Happy to discuss the architecture or answer questions about the gotchas we hit.
