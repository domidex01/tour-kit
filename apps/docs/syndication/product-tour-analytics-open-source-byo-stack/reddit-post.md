## Subreddit: r/reactjs

**Title:** I compared the cost of SaaS tour analytics vs building your own with PostHog/Plausible — here's what I found

**Body:**

I've been building a headless product tour library and needed analytics for tour completion, step drop-off, and time-on-step. The SaaS options (Appcues at $249/mo, Chameleon at $279/mo, Pendo at $800+/mo) all bundle analytics into their platforms, which means your tour data lives on their servers and disappears when you cancel.

So I built a plugin-based analytics layer that routes tour events to whatever backend you want. Tested it with four setups:

1. **PostHog** (self-hosted or cloud, 1M free events/mo) — full funnels, retention, session replay. The closest to replacing Amplitude. Needs 16 GB RAM to self-host though.
2. **Plausible** — no cookies, ~1 KB, GDPR-compliant by default. Good for basic "did they finish the tour?" counts, but no funnel visualization.
3. **Umami** — MIT-licensed, deploys to Vercel, custom events since v2. The win here is direct SQL access to your Postgres event data.
4. **Custom API route** — just `navigator.sendBeacon` to your own endpoint. Tour completion rate is a single SQL query.

The cost difference at 10K MAU is pretty stark: $2,988-$10,000/year for SaaS vs $0-960/year for BYO.

The tradeoff is real though — you lose drag-and-drop dashboards and visual tour builders. If your PM needs Pendo-style reports, they'll need SQL training or a Grafana setup.

I wrote up the full comparison with TypeScript plugin code, a cost table, and the five metrics actually worth tracking (spoiler: "tours started" is a vanity metric): https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack

Curious what analytics setup others are using for onboarding flows. Anyone running PostHog self-hosted for this?
