## Thread (6 tweets)

**1/** We added a 6-step product tour to a Next.js dashboard. CLS jumped from 0.04 to 0.12 overnight. One tooltip animation was enough to push it past the "Good" threshold.

Most teams never check this. Here's how to catch it with Vercel Speed Insights:

**2/** Every tour step transition is measurable:
- Overlay render = CLS impact
- "Next" button click = INP measurement
- Tour hero image = potential LCP element

Product tours have a real Core Web Vitals cost that nobody talks about.

**3/** The fix isn't removing the tour. It's measuring both engagement AND performance together.

Wire Tour Kit lifecycle events to Vercel Analytics `track()` for completion rates. Use Speed Insights for CWV. Same dashboard.

**4/** The trick nobody covers: Speed Insights has a `beforeSend` callback.

Tag speed data with `?tour=active` when a tour overlay is in the DOM. Filter by that in the Vercel dashboard. Instant A/B performance comparison, no experimentation framework needed.

**5/** Key thresholds for tours:
- CLS ≤ 0.1 (highest risk)
- INP ≤ 200ms (every click measured)
- LCP ≤ 2.5s (watch tour images)

Portal-based rendering helps CLS. But animations still trigger reflows.

**6/** Full guide with TypeScript code (50 lines, 3 files), CWV impact table, and advanced patterns (sampleRate tuning, Vercel Drains, VES deployment gates):

https://usertourkit.com/blog/vercel-analytics-product-tour-speed
