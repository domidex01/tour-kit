---
title: "How to measure your product tour's impact on Core Web Vitals with Vercel"
published: false
description: "We wired a 6-step tour into a Next.js dashboard. CLS jumped from 0.04 to 0.12 overnight. Here's how to catch that before your users do."
tags: react, webdev, javascript, tutorial
canonical_url: https://usertourkit.com/blog/vercel-analytics-product-tour-speed
cover_image: https://usertourkit.com/og-images/vercel-analytics-product-tour-speed.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/vercel-analytics-product-tour-speed)*

# Tour Kit + Vercel Analytics: measuring tour impact on speed

Product tours add DOM elements, reposition overlays, and run animations on every step transition. That work has a measurable cost. When we wired a 6-step onboarding tour into a Next.js dashboard and checked Speed Insights the next morning, CLS had jumped from 0.04 to 0.12 on mobile. One tooltip with an entrance animation was enough to push it past the "Good" threshold.

Most teams never catch this. They add a tour, watch completion rates, and call it done. Meanwhile, every step change triggers a layout shift that Vercel Speed Insights quietly records but nobody reviews. The fix isn't removing the tour. The fix is measuring the tour's performance impact alongside its engagement metrics so you can improve both.

Vercel Analytics and Speed Insights are a good fit for this because they're cookie-free, GDPR-compliant by default, and already loaded if you deploy on Vercel. No consent banner required, which itself avoids the CLS hit that GA4's cookie consent UI can introduce on first paint.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics @vercel/analytics @vercel/speed-insights
```

## What you'll build

This integration wires Tour Kit's 6 lifecycle events (start, step view, complete, dismiss, skip, error) to Vercel Analytics custom events and tags Speed Insights data with tour context so you can isolate Core Web Vitals impact per route. Open the Vercel dashboard, filter by URL, and see whether your onboarding tour degrades LCP, CLS, or INP on the pages where it runs. About 50 lines of TypeScript across 3 files. Zero additional runtime dependencies beyond the two Vercel packages.

One thing upfront: Tour Kit requires React 18.2+ and doesn't have a visual editor. You write steps in code. Vercel Analytics custom events need a Pro or Enterprise plan. Speed Insights basic metrics work on the free tier.

## Why Vercel Analytics and not GA4?

Vercel Analytics tracks pageviews and custom events without cookies, so there's no consent banner to render. GA4 requires a cookie consent UI that fires after initial paint, and that UI itself can cause CLS if it shifts page content. On a dashboard page where your tour launches immediately, two things fighting for layout space on load is a recipe for a poor CLS score.

The deeper reason: Vercel Speed Insights gives you real user Core Web Vitals data (LCP, CLS, INP, FCP, TTFB) broken down by route, device type, and deployment. As of April 2026, it uses Real Experience Score (RES), a weighted composite of all six metrics using log-normal distributions from HTTP Archive data ([Vercel docs](https://vercel.com/docs/speed-insights/metrics)). That's RUM data from your actual users, not Lighthouse estimates from a lab environment.

GA4 doesn't report Core Web Vitals at all. You'd need a separate tool for performance monitoring. Vercel bundles both in one dashboard.

## Prerequisites

- Next.js 14+ (or any React framework deployed on Vercel)
- Vercel Pro plan (for custom event tracking)
- Tour Kit installed: `@tourkit/core`, `@tourkit/react`
- A working product tour with at least 3 steps

If you don't have a tour yet, the [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) covers setup from scratch.

## Step 1: Add Vercel Analytics and Speed Insights

Install two packages and mount their React components once in your root layout. `<Analytics />` handles pageview and custom event tracking while `<SpeedInsights />` collects real-user Core Web Vitals on every page load. Both are MIT-licensed, load asynchronously, and add negligible weight to your bundle.

```tsx
// app/layout.tsx
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

Neither package tracks anything in dev mode. You won't see events until you deploy.

Speed Insights collects up to 6 data points per page visit: TTFB and FCP on load, FID and LCP on first interaction, INP and CLS when the user leaves ([Vercel Speed Insights docs](https://vercel.com/docs/speed-insights/quickstart)). Every tour "Next" button click is an interaction that INP captures.

## Step 2: Wire Tour Kit events to Vercel Analytics

Tour Kit's `@tour-kit/analytics` package fires callbacks on 6 lifecycle events. Instead of scattering `track()` calls through your components, configure the analytics plugin once and every tour in your app gets instrumented.

```tsx
// src/lib/tour-analytics.ts
import { track } from "@vercel/analytics";
import type { TourAnalyticsEvent } from "@tourkit/analytics";

export function handleTourEvent(event: TourAnalyticsEvent) {
  const { type, tourId, stepIndex, metadata } = event;

  // Vercel Pro plan: max 2 custom data keys per event
  // Pack the most useful dimensions into those 2 slots
  switch (type) {
    case "tour_started":
      track("Tour Started", { tourId, steps: String(metadata?.totalSteps) });
      break;
    case "step_viewed":
      track("Step Viewed", { tourId, step: String(stepIndex) });
      break;
    case "tour_completed":
      track("Tour Completed", { tourId, duration: String(metadata?.duration) });
      break;
    case "tour_dismissed":
      track("Tour Dismissed", { tourId, step: String(stepIndex) });
      break;
  }
}
```

Then register it in your provider:

```tsx
// src/providers/tour-provider.tsx
import { TourKitProvider } from "@tourkit/react";
import { AnalyticsProvider } from "@tourkit/analytics";
import { handleTourEvent } from "@/lib/tour-analytics";

export function AppTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider>
      <AnalyticsProvider onEvent={handleTourEvent}>
        {children}
      </AnalyticsProvider>
    </TourKitProvider>
  );
}
```

The gotcha we hit: Vercel's `track()` function accepts string, number, boolean, or null values only. No nested objects, no arrays. And each value maxes out at 255 characters. If your tour IDs are UUIDs, they fit. If you're passing step content as metadata, truncate it.

## Step 3: Attach tour context to Speed Insights

Speed Insights exposes a `beforeSend` callback that lets you modify performance data before it ships to Vercel, and no other tour integration guide covers this pattern. Tag each speed event with the current tour state so you can correlate CWV degradation with specific tours and specific steps, not just the route in general.

```tsx
// app/layout.tsx (updated)
import { Analytics } from "@vercel/analytics/react";
import { SpeedInsights } from "@vercel/speed-insights/next";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {children}
        <Analytics />
        <SpeedInsights
          beforeSend={(data) => {
            const tourActive = document.querySelector(
              "[data-tour-kit-overlay]"
            );
            if (tourActive) {
              return {
                ...data,
                url: `${data.url}?tour=active`,
              };
            }
            return data;
          }}
        />
      </body>
    </html>
  );
}
```

This appends `?tour=active` to the URL in Speed Insights data when a tour overlay is present. In the Vercel dashboard, filter by URLs containing `tour=active` to see CWV exclusively from sessions where the tour was visible. Compare against the same route without the parameter. That's your A/B performance comparison without any experimentation framework.

## Step 4: Check the dashboard

After deploying to a preview or production branch, trigger a few tour sessions and head to the Vercel dashboard. The data takes 1-2 minutes to appear, and you'll find it in two places.

1. **Analytics tab** shows "Tour Started", "Step Viewed", "Tour Completed", and "Tour Dismissed" as custom events with the metadata you passed
2. **Speed Insights tab** shows CWV metrics. Filter by the route where your tour runs
3. Compare the RES score for pages with `?tour=active` versus the same route without it

The scores use a 0-100 scale: 90-100 is green (good), 50-89 is orange (needs improvement), 0-49 is red (poor). Vercel calculates these at the P75 percentile by default, meaning 75% of your users need a "Good" experience for the metric to rate "Good" ([Vercel Speed Insights docs](https://vercel.com/docs/speed-insights/metrics)).

| Metric | Good threshold | Tour impact risk | What to watch |
|--------|---------------|-----------------|---------------|
| LCP | ≤ 2.5s | Medium | Large tour images becoming the LCP element |
| CLS | ≤ 0.1 | High | Overlay rendering that shifts existing content |
| INP | ≤ 200ms | Medium | Heavy JS on "Next" button clicks (spotlight repositioning) |
| FCP | ≤ 1.8s | Low | Tour JS blocking first paint (lazy-load to avoid) |
| TTFB | < 800ms | None | Server-side, tours don't affect this |

CLS is the metric most affected by product tours. Any overlay that shifts existing DOM content on render adds to the CLS score. Tour Kit renders via portals (outside the main content flow) which minimizes this, but animated entrance effects can still trigger layout recalculation.

## Going further

Once the basic wiring is live and you've confirmed events flow to both Analytics and Speed Insights, three patterns push this integration from "monitoring" to "regression prevention."

**`sampleRate` tuning for high-traffic pages.** Speed Insights defaults to 100% sampling. If your onboarding page handles thousands of sessions daily, set `sampleRate={0.5}` on the `<SpeedInsights />` component to reduce data volume while keeping statistical significance. Keep custom event tracking at 100% since those are lower volume.

**Vercel Drains for long-term analysis.** Released in October 2025, Vercel Drains pipe Speed Insights and Analytics data to external services like Datadog or Splunk. If you need multi-week trend analysis comparing tour performance across deployments, Drains give you the raw data outside Vercel's retention window.

**Virtual Experience Score as a deployment gate.** Vercel's VES runs synthetic performance checks per deployment via Checkly integration. If a tour code change (new step content, updated spotlight logic) regresses the score, you catch it before real users are affected. Set a VES threshold in your CI pipeline to block deploys that drop below 85.

## FAQ

### Does Vercel Analytics track events in development mode?

Vercel Analytics does not fire events in development mode. Both `@vercel/analytics` and `@vercel/speed-insights` only collect data on deployed Vercel previews and production. To verify your `track()` calls work, deploy to a preview branch and check the Vercel dashboard within a few minutes.

### Can I use Vercel Analytics custom events on the free plan?

Custom events through `track()` require a Vercel Pro or Enterprise plan. The free tier gives you pageview analytics and Speed Insights basic metrics (all Core Web Vitals) but not custom event tracking. You can still monitor tour performance impact via Speed Insights by comparing CWV before and after deploying tour changes.

### How does Tour Kit minimize CLS compared to other tour libraries?

Tour Kit renders overlays via React portals, outside the main document flow. The tooltip and backdrop don't push existing content around when they appear. Libraries that inject elements inline cause surrounding content to reflow, directly contributing to CLS. Core ships at under 8KB gzipped.

### Will adding two Vercel packages hurt my bundle size?

Both `@vercel/analytics` and `@vercel/speed-insights` load as small async scripts. They don't block rendering or contribute to your main JS bundle in a meaningful way. Combined with Tour Kit's core (under 8KB gzipped), the total footprint of the tour + analytics integration stays well under 20KB. For comparison, a single SaaS onboarding tool's injected script typically runs 80-200KB.

### Can I track tour events server-side?

Vercel Analytics supports server-side tracking via `import { track } from '@vercel/analytics/server'`. This is useful for logging tour completion events in API routes (for example, when a user completes onboarding and you update their profile). Server-side events bypass ad blockers entirely.
