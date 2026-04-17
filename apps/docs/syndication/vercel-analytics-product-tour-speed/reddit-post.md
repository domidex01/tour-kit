## Subreddit: r/nextjs (primary), r/reactjs (secondary)

**Title:** We measured how a product tour affects Core Web Vitals using Vercel Speed Insights — CLS jumped 3x on mobile

**Body:**

We added a 6-step onboarding tour to a Next.js dashboard and forgot to check Speed Insights for two weeks. When we finally looked, CLS on mobile had gone from 0.04 to 0.12 — past the "Good" threshold. The culprit was a single tooltip with a fade-in animation that triggered layout recalculation.

The thing is, most product tour libraries don't mention their CWV impact at all. You add a tour, watch completion rates, and assume everything's fine. Meanwhile every step transition is an INP measurement, every overlay render can shift existing content (CLS), and if your tour has a hero image it can become the LCP element.

We wrote up how to wire tour lifecycle events to Vercel Analytics custom events and — the part that was genuinely useful — how to use the `beforeSend` callback on `<SpeedInsights />` to tag performance data with tour context. Append `?tour=active` to the URL in speed data when a tour overlay is in the DOM, then filter by that in the dashboard. Instant A/B performance comparison without an experimentation framework.

Key thresholds that matter for tours:
- CLS ≤ 0.1 (highest risk — overlay rendering shifts content)
- INP ≤ 200ms (every "Next" button click is measured)
- LCP ≤ 2.5s (large tour images can become the LCP element)

Portal-based rendering helps a lot with CLS since the overlay is outside the main document flow. But animations still trigger reflows.

Full writeup with TypeScript code (about 50 lines across 3 files): https://usertourkit.com/blog/vercel-analytics-product-tour-speed

Happy to answer questions about the `beforeSend` pattern or CWV impact of different rendering approaches.
