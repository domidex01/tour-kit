## Channel: #articles or #show-off in Reactiflux

**Message:**

Hey all — I wrote a tutorial on connecting Stripe Billing webhook events to in-app product tours in a Next.js app. Covers the full pipeline: Stripe fires `trial_will_end` or `payment_failed`, a Next.js API route stores the trigger, a React hook polls for it, and Tour Kit renders a contextual upgrade tour.

Three gotchas documented: bridging server-side webhooks to the client (polling vs SSE), deduplicating when Stripe fires multiple events at once, and provider placement for the `useTour()` hook.

https://usertourkit.com/blog/tour-kit-stripe-billing-upgrade-tours

Uses Tour Kit, a headless tour library I built (under 8KB gzipped core). The Stripe webhook-to-tour pattern applies to any tour library though. Let me know if you've tried similar billing-driven UI patterns or if anything's unclear.

*Originally published at usertourkit.com*
