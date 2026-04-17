We added a product tour to our Next.js dashboard. Two weeks later, we checked Vercel Speed Insights and found CLS had jumped from 0.04 to 0.12 on mobile.

One tooltip with a fade-in animation was enough to push the metric past Google's "Good" threshold.

Product tours add DOM elements, reposition overlays, and trigger animations on every step transition. That work has a measurable cost — but most teams only track completion rates and never look at the performance side.

The fix: wire tour lifecycle events to Vercel Analytics for engagement, then use Speed Insights' beforeSend callback to tag CWV data with tour context. Filter by routes where the tour was active. Compare against the same route without it.

Key risk metrics for product tours:
- CLS (layout shifts from overlay rendering) — highest risk
- INP (every "Next" button click is measured)
- LCP (tour images can become the largest contentful element)

Wrote up the full integration with TypeScript code: https://usertourkit.com/blog/vercel-analytics-product-tour-speed

#react #nextjs #webperformance #corewebvitals #productdevelopment #opensource
