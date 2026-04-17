---
title: "Tour Kit + Vercel Analytics: measuring tour impact on speed"
slug: "vercel-analytics-product-tour-speed"
canonical: https://usertourkit.com/blog/vercel-analytics-product-tour-speed
tags: react, javascript, web-development, performance
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

This integration wires Tour Kit's 6 lifecycle events to Vercel Analytics custom events and tags Speed Insights data with tour context so you can isolate Core Web Vitals impact per route. About 50 lines of TypeScript across 3 files. Zero additional runtime dependencies beyond the two Vercel packages.

Tour Kit requires React 18.2+ and doesn't have a visual editor. You write steps in code. Vercel Analytics custom events need a Pro or Enterprise plan. Speed Insights basic metrics work on the free tier.

## Why Vercel Analytics and not GA4?

Vercel Analytics tracks pageviews and custom events without cookies, so there's no consent banner to render. GA4 requires a cookie consent UI that fires after initial paint, and that UI itself can cause CLS if it shifts page content.

Vercel Speed Insights gives you real user Core Web Vitals data (LCP, CLS, INP, FCP, TTFB) broken down by route, device type, and deployment. As of April 2026, it uses Real Experience Score (RES), a weighted composite using log-normal distributions from HTTP Archive data. That's RUM data from your actual users, not Lighthouse estimates.

GA4 doesn't report Core Web Vitals at all. Vercel bundles both analytics and performance monitoring in one dashboard.

## Step 1: Add Vercel Analytics and Speed Insights

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

## Step 2: Wire Tour Kit events to Vercel Analytics

```tsx
// src/lib/tour-analytics.ts
import { track } from "@vercel/analytics";
import type { TourAnalyticsEvent } from "@tourkit/analytics";

export function handleTourEvent(event: TourAnalyticsEvent) {
  const { type, tourId, stepIndex, metadata } = event;

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

Register it in your provider:

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

Gotcha: Vercel's `track()` accepts string, number, boolean, or null only. No nested objects. Max 255 characters per value. Pro plan limits you to 2 custom data keys per event.

## Step 3: Attach tour context to Speed Insights

The `beforeSend` callback on Speed Insights lets you tag performance data with the current tour state:

```tsx
<SpeedInsights
  beforeSend={(data) => {
    const tourActive = document.querySelector("[data-tour-kit-overlay]");
    if (tourActive) {
      return { ...data, url: `${data.url}?tour=active` };
    }
    return data;
  }}
/>
```

Filter by `?tour=active` in the Vercel dashboard to see CWV exclusively from sessions where a tour was visible. Compare against the same route without the parameter.

## Tour impact on Core Web Vitals

| Metric | Good threshold | Tour impact risk | What to watch |
|--------|---------------|-----------------|---------------|
| LCP | ≤ 2.5s | Medium | Large tour images becoming the LCP element |
| CLS | ≤ 0.1 | High | Overlay rendering that shifts existing content |
| INP | ≤ 200ms | Medium | Heavy JS on "Next" button clicks |
| FCP | ≤ 1.8s | Low | Tour JS blocking first paint |
| TTFB | < 800ms | None | Server-side, tours don't affect this |

CLS is the biggest risk. Tour Kit renders via portals (outside the main content flow) which minimizes this, but animated entrance effects can still trigger layout recalculation.

Full article with code examples, advanced patterns (sampleRate tuning, Vercel Drains, VES deployment gates), and FAQ: [usertourkit.com/blog/vercel-analytics-product-tour-speed](https://usertourkit.com/blog/vercel-analytics-product-tour-speed)
