## Title: Product tour analytics without SaaS – four open-source stacks compared

## URL: https://usertourkit.com/blog/product-tour-analytics-open-source-byo-stack

## Comment to post immediately after:

I built a headless product tour library for React and needed analytics for tour completion rates, step drop-off, and time-on-step metrics. The SaaS options (Appcues, Pendo, Chameleon) all bundle analytics into their platforms at $249-800+/month, and your data leaves when you cancel.

So I tested four open-source alternatives: PostHog (full product analytics, 1M free events/mo, self-hostable), Plausible (privacy-first, ~1 KB, no funnels), Umami (MIT, deploys to Vercel, direct SQL access), and a custom API route with navigator.sendBeacon.

The interesting finding: the cost gap at 10K MAU is $2,988-$10,000/year for SaaS vs $0-960/year for BYO. The tradeoff is real though — you lose visual dashboards and need someone who can write SQL.

The article includes TypeScript plugin code for each stack and a comparison table. Happy to answer questions about the analytics plugin architecture.
