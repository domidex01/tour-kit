## Title: Wiring Stripe Billing webhooks to contextual upgrade tours in React

## URL: https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

## Comment to post immediately after:

I wrote up the architecture for connecting Stripe Billing webhook events to in-app product tours. The core idea: Stripe already knows when trials are ending, payments fail, and users downgrade. These events make better upgrade tour triggers than arbitrary timers or static banners.

The implementation uses a Next.js API route to receive Stripe webhooks, stores triggers in a database keyed by customer ID, and has the client poll every 30 seconds. Five Stripe events map to five tour types — trial_will_end, payment_failed, subscription_updated, invoice_paid, and subscription_deleted.

Three technical findings worth noting:
- Stripe can fire multiple events simultaneously from a single subscription change, so you need tour deduplication
- The server-to-client bridge is the main architectural decision (we chose polling over SSE)
- Contextual prompts convert at 2.3x vs random CTAs (Appcues data), and Mixpanel reports 32% higher upgrade rates from event-driven prompts

I built the tour library used in the article (Tour Kit), so take the product recommendations with appropriate skepticism. The webhook architecture itself is library-agnostic.
