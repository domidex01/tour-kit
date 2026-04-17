Most SaaS onboarding platforms charge $249-800+/month and your analytics data leaves when you cancel.

I tested four open-source alternatives for product tour analytics and documented the results:

PostHog gives you the full Amplitude experience (funnels, retention, session replay) for $0 with self-hosting. Plausible and Umami handle basic event tracking at ~1 KB with zero cookies. And a custom API route with navigator.sendBeacon costs nothing beyond your existing database.

The cost gap at 10K monthly users: $3,000-10,000/year for SaaS vs $0-960/year for a BYO stack.

The tradeoff is engineering time — you lose drag-and-drop dashboards and visual builders. But if your team already writes React code and SQL queries, the analytics side is straightforward.

Full guide with TypeScript code, cost tables, and the five tour metrics actually worth tracking: https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack

#react #opensource #analytics #productdevelopment #webdevelopment
