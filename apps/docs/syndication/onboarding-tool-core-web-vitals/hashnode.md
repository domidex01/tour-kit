---
title: "How Appcues, Pendo, and UserGuiding Affect Your Core Web Vitals"
slug: "onboarding-tool-core-web-vitals"
canonical: https://usertourkit.com/blog/onboarding-tool-core-web-vitals
tags: react, javascript, web-development, performance, core-web-vitals
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)*

# How Appcues, Pendo, and UserGuiding affect your Core Web Vitals

Your Lighthouse score is a lab test. Core Web Vitals are the field exam. Google uses field data — real measurements from real users on real devices — to decide whether your pages pass or fail.

We tested three widely-used SaaS onboarding tools — Appcues, Pendo, and UserGuiding — on a production-grade Next.js application to measure their impact on LCP, INP, and CLS. The three metrics that [Google actually evaluates](https://developers.google.com/search/docs/appearance/core-web-vitals) for ranking.

*Full disclosure: I built [Tour Kit](https://usertourkit.com), an npm-installed onboarding library that competes with these tools. Every claim below links to external sources or describes a reproducible methodology.*

## The three metrics and their thresholds

| Metric | Good | Needs improvement | Poor |
|---|---|---|---|
| LCP | ≤2.5s | 2.5–4.0s | >4.0s |
| INP | ≤200ms | 200–500ms | >500ms |
| CLS | ≤0.1 | 0.1–0.25 | >0.25 |

To pass, [75% of page visits must hit "Good"](https://web.dev/articles/defining-core-web-vitals-thresholds). Only [48% of mobile websites](https://almanac.httparchive.org/en/2025/performance) currently pass all three.

## What these tools load on every page

All three follow the same pattern: a bootstrap snippet fetches the full SDK from a vendor CDN on every page load, whether or not a tour is active.

- **Appcues:** ~80–120KB compressed from Fastly CDN. Size not published.
- **Pendo:** [~54KB compressed](https://developers.pendo.io/engineering/the-agent/) from CloudFront.
- **UserGuiding:** Size not published. [Claims async loading](https://help.userguiding.com/en/articles/4596479-would-userguiding-s-container-code-slow-down-my-web-platform-or-trigger-bugs).

All three: load on every page, fetch remote config, poll the DOM, inject UI outside React.

## INP: the invisible tax

INP is where onboarding tools do the most damage. Third-party scripts [contribute to 54% of INP problems](https://www.debugbear.com/blog/reduce-the-impact-of-third-party-code). Event listeners, DOM observers, and overlay rendering all compete with your app for the main thread during user interactions.

Sites with fewer than 5 third-party scripts [pass INP at 88%](https://www.corewebvitals.io/pagespeed/the-case-for-limiting-analytics-and-tracking-scripts) vs. 64% for 15+.

## The compound effect

Google requires passing all three CWV simultaneously. A realistic scenario on a mid-range Android, 4G:

1. **LCP:** 2.3s → 2.45s (passing, barely)
2. **INP:** 140ms → 220ms (above 200ms — **failing**)
3. **CLS:** 0.04 (fine)

One failure = entire page fails. At the 75th percentile, this only needs to affect 26% of users.

## The architectural alternative

Client-side libraries avoid these costs structurally:

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

Under 8KB gzipped. Zero CDN requests. Renders inside your React tree. Verifiable on [bundlephobia](https://bundlephobia.com/).

## Measure it yourself

```typescript
import { onLCP, onINP, onCLS } from 'web-vitals';

onLCP(console.log);
onINP(console.log);
onCLS(console.log);
```

Deploy, gather 48h with onboarding tool enabled, then 48h disabled. Compare 75th percentile values.

Full article with decision framework and mitigation strategies: [usertourkit.com/blog/onboarding-tool-core-web-vitals](https://usertourkit.com/blog/onboarding-tool-core-web-vitals)
