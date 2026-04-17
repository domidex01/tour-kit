## Subreddit: r/reactjs

**Title:** I wired Stripe webhook events to in-app upgrade tours — here are the 3 gotchas I hit

**Body:**

Been working on connecting Stripe Billing lifecycle events to contextual product tours in a Next.js app. The idea: instead of showing random upgrade banners, trigger tours based on real billing events like trial expiration, payment failures, and feature limits.

Three things tripped me up:

1. **Server-to-client bridge** — Stripe webhooks hit your server, not your browser. I ended up polling a `/api/tour-triggers` endpoint every 30 seconds. SSE works too but polling was simpler for our use case.

2. **Event collision** — Stripe fires multiple events simultaneously (a subscription update triggers both `customer.subscription.updated` AND `invoice.paid`). Without deduplication, you get two tours fighting for attention. I added a "one tour at a time" queue.

3. **React context ordering** — The polling hook calls `useTour()`, which needs to be inside the `TourProvider`. Obvious in hindsight, but I initially placed it in the layout above the provider and got a cryptic context error.

The interesting data point: contextual upgrade prompts shown after a user experiences value convert at 2.3x the rate of random CTAs (per Appcues research). Mixpanel reported 32% higher plan upgrades from event-driven prompts vs static banners.

I used Tour Kit (which I built — full disclosure) for the tour rendering, but the webhook-to-tour architecture works with any product tour library.

Full writeup with all the code: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours
