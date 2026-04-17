# How product tours silently wreck your Core Web Vitals (and how to catch it)

## Vercel Analytics + Speed Insights make the invisible visible

*Originally published at [usertourkit.com](https://usertourkit.com/blog/vercel-analytics-product-tour-speed)*

Product tours add DOM elements, reposition overlays, and run animations on every step transition. That work has a measurable cost. When we wired a 6-step onboarding tour into a Next.js dashboard and checked Speed Insights the next morning, CLS had jumped from 0.04 to 0.12 on mobile. One tooltip with an entrance animation was enough to push it past the "Good" threshold.

Most teams never catch this. They add a tour, watch completion rates, and call it done. Meanwhile, every step change triggers a layout shift that Vercel Speed Insights quietly records but nobody reviews.

---

## The cookie-free advantage

Vercel Analytics tracks pageviews and custom events without cookies. No consent banner needed. GA4 requires a cookie consent UI that fires after initial paint — that UI itself can cause layout shifts. On a dashboard page where your tour launches immediately, two things fighting for layout space on load is a recipe for poor CLS.

Vercel Speed Insights gives you real user Core Web Vitals (LCP, CLS, INP, FCP, TTFB) broken down by route, device, and deployment. As of April 2026, it uses Real Experience Score — a weighted composite from real HTTP Archive data, not Lighthouse lab estimates.

## The integration in 50 lines

The approach: wire Tour Kit's lifecycle events to Vercel's `track()` function for engagement metrics, then use Speed Insights' `beforeSend` callback to tag performance data with tour context.

For engagement, map tour events to custom analytics events with the most useful metadata packed into Vercel's 2-key-per-event limit on Pro plans.

For performance, append `?tour=active` to the URL in Speed Insights data whenever a tour overlay is present. Filter by that parameter in the dashboard to compare CWV for tour sessions vs. non-tour sessions on the same route.

## What to watch

CLS is the metric most affected by product tours. Any overlay that shifts existing DOM content on render adds to the CLS score. INP captures every "Next" button click. LCP can spike if a tour's welcome modal contains a large hero image.

The key thresholds: LCP at 2.5 seconds, CLS at 0.1, INP at 200ms.

Tour Kit renders via React portals (outside the main content flow) which minimizes CLS impact, but animated entrance effects can still trigger layout recalculation. This is where the monitoring pays off — you see the problem in real user data before it affects your search rankings.

## Going further

Three patterns worth exploring: `sampleRate` tuning for high-traffic onboarding pages, Vercel Drains for piping data to Datadog or Splunk for long-term trend analysis, and Virtual Experience Score (VES) as a CI deployment gate to catch tour performance regressions before they reach users.

---

Full article with complete TypeScript code, step-by-step setup, comparison table, and FAQ: [usertourkit.com/blog/vercel-analytics-product-tour-speed](https://usertourkit.com/blog/vercel-analytics-product-tour-speed)

**Suggested Medium publications:** JavaScript in Plain English, Better Programming, Bits and Pieces
