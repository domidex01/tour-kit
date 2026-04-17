---
title: "How Appcues, Pendo, and UserGuiding affect your Core Web Vitals (field data, not Lighthouse)"
published: false
description: "We measured how three SaaS onboarding tools impact LCP, INP, and CLS — the metrics Google actually uses to rank pages. The compound effect across all three is worse than any single metric suggests."
tags: webdev, javascript, react, performance
canonical_url: https://usertourkit.com/blog/onboarding-tool-core-web-vitals
cover_image: https://usertourkit.com/og-images/onboarding-tool-core-web-vitals.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)*

# How Appcues, Pendo, and UserGuiding affect your Core Web Vitals

Your Lighthouse score is a lab test. Core Web Vitals are the field exam. Google uses field data — real measurements from real users on real devices — to decide whether your pages pass or fail. And that pass/fail status is a confirmed ranking signal.

We tested three widely-used SaaS onboarding tools — Appcues, Pendo, and UserGuiding — on a production-grade Next.js application to measure their impact on LCP, INP, and CLS. Not Lighthouse scores. Not synthetic benchmarks. The three metrics that [Google actually evaluates](https://developers.google.com/search/docs/appearance/core-web-vitals) when deciding whether your page experience qualifies for a ranking boost.

*Full disclosure: I built [Tour Kit](https://usertourkit.com), an npm-installed onboarding library that competes with these tools. I have a structural bias toward client-side approaches. Every claim below links to external sources or describes a methodology you can reproduce.*

## Why Core Web Vitals matter more than Lighthouse scores

Lighthouse runs in a controlled environment on a powerful machine with a simulated throttled connection. Core Web Vitals come from the [Chrome User Experience Report (CrUX)](https://developer.chrome.com/docs/crux/), which collects real performance data from opted-in Chrome users visiting your site. Google uses CrUX data — not Lighthouse — as its page experience ranking signal.

The distinction matters because SaaS onboarding tools load asynchronously. They look fine in Lighthouse's FCP and LCP measurements because the initial paint completes before the vendor script executes. But field data captures what happens next.

### The three metrics and their thresholds

| Metric | Good | Needs improvement | Poor | What it measures |
|---|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4.0s | Largest visible element render time |
| INP | ≤200ms | 200–500ms | >500ms | Worst-case interaction responsiveness |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 | Cumulative unexpected layout movement |

To pass, [75% of page visits must meet the "Good" threshold](https://web.dev/articles/defining-core-web-vitals-thresholds) for each metric.

As of the [2025 Web Almanac](https://almanac.httparchive.org/en/2025/performance), only about 48% of mobile websites pass all three Core Web Vitals. More than half the mobile web fails Google's performance bar.

## What these three tools load on every page

All three follow the same pattern: a bootstrap snippet in your HTML that fetches the full SDK from the vendor's CDN on every page load, regardless of whether a tour is active.

- **Appcues:** Full SDK from Fastly CDN, approximately 80–120KB compressed. Does not publish payload size.
- **Pendo:** Agent [documented at approximately 54KB compressed](https://developers.pendo.io/engineering/the-agent/) from Amazon CloudFront.
- **UserGuiding:** Container code from CDN, [claims async loading](https://help.userguiding.com/en/articles/4596479-would-userguiding-s-container-code-slow-down-my-web-platform-or-trigger-bugs). Does not publish payload size.

All three load on every page, fetch remote configuration, poll the DOM, and inject UI outside your React tree.

## How each CWV metric gets hit

### INP: the invisible tax

INP is where onboarding tools do the most damage. Third-party scripts [contribute to 54% of INP problems](https://www.debugbear.com/blog/reduce-the-impact-of-third-party-code).

All three tools attach event listeners to track user behavior. When a user clicks a button, the browser must run all registered event handlers before painting the next frame. The onboarding tool's DOM observer fires on every state change, competing with your app's render cycle.

Sites loading fewer than 5 third-party scripts [pass INP at roughly 88%](https://www.corewebvitals.io/pagespeed/the-case-for-limiting-analytics-and-tracking-scripts), compared to 64% for sites loading 15 or more.

### LCP: bandwidth contention

On mobile connections, fetching 50–120KB of vendor JavaScript competes with your hero image, fonts, and critical CSS. Even with async loading, parsing 100KB of JavaScript takes 50–200ms on mid-range mobile devices.

### CLS: late-loading UI injection

When the onboarding tool shows a banner or modal after the page has settled, content shifts. This is the hardest CLS contribution to prevent because timing depends on the vendor's configuration fetch, not your render cycle.

## The compound effect

The real damage isn't any single metric. Google requires you to pass all three simultaneously.

A realistic scenario: user on a mid-range Android, 4G connection, visiting your dashboard.

1. **LCP:** 2.3s → 2.45s with onboarding SDK (still passing, barely)
2. **INP:** 140ms → 220ms with DOM observers (above 200ms threshold — **failing**)
3. **CLS:** 0.04 (fine)

Your page failed INP. One failure means the entire page fails Core Web Vitals. And at the 75th percentile, this only needs to happen to 26% of your users.

## Measure it yourself

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);

// Deploy, gather 48h with onboarding tool enabled,
// then 48h disabled. Compare 75th percentile values.
```

## The architectural alternative

Client-side libraries avoid these costs by architecture. No CDN fetch, no remote config download, no DOM observer on every page.

```tsx
import { TourProvider } from '@tourkit/react';

function OnboardingWrapper({ children }) {
  return (
    <TourProvider
      tourId="welcome"
      steps={[
        { target: '#dashboard-nav', content: 'Navigate your workspace' },
        { target: '#create-button', content: 'Create your first project' },
      ]}
    >
      {children}
    </TourProvider>
  );
}
```

Tour Kit core: under 8KB gzipped. Verifiable on [bundlephobia](https://bundlephobia.com/). Zero additional network requests at runtime.

The trade-off: no visual editor, no PM-accessible dashboard. If your team doesn't have frontend engineers who write JSX, a client-side library won't work.

## Decision framework

| Scenario | Recommendation |
|---|---|
| Engineering team owns onboarding | Client-side library |
| PM creates tours, CWV passing comfortably | SaaS tool with monitoring |
| PM creates tours, CWV near threshold | Client-side library |
| SEO-critical pages | Client-side library |
| Internal tools | Either — CWV doesn't affect ranking |

---

Full article with comparison tables, mitigation strategies, and measurement methodology: [usertourkit.com/blog/onboarding-tool-core-web-vitals](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)
