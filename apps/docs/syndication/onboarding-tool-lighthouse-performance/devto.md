---
title: "We audited how SaaS onboarding tools affect your Lighthouse score"
published: false
description: "No SaaS onboarding vendor publishes their script payload size. We measured the real Lighthouse impact of third-party onboarding tools vs client-side libraries."
tags: react, javascript, webdev, performance
canonical_url: https://usertourkit.com/blog/onboarding-tool-lighthouse-performance
cover_image: https://usertourkit.com/og-images/onboarding-tool-lighthouse-performance.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)*

# The performance cost of onboarding SaaS tools: a Lighthouse audit

You added an onboarding tool. Your Lighthouse score dropped 15 points. Nobody connected the two events until a PM noticed the regression three sprints later.

This is a common sequence. SaaS onboarding platforms like Appcues, Pendo, WalkMe, Whatfix, and Userpilot inject third-party JavaScript that competes with your app for the main thread. The cost is measurable, but no vendor publishes their script payload size. We decided to measure it ourselves.

## What does Lighthouse actually measure?

Lighthouse calculates a weighted performance score from six metrics. TBT at 30% weight matters more than any other single metric for third-party script evaluation.

| Metric | Weight | What it measures | Third-party risk |
|--------|--------|------------------|-----------------|
| Total Blocking Time (TBT) | 30% | Main thread blocked >50ms | High |
| Largest Contentful Paint (LCP) | 25% | Largest visible element render | Medium |
| Cumulative Layout Shift (CLS) | 15% | Unexpected layout movement | Medium |
| First Contentful Paint (FCP) | 10% | First pixel rendered | Low-Medium |
| Speed Index (SI) | 10% | Visual completeness over time | Medium |
| Interaction to Next Paint (INP) | 10% | Input responsiveness | High |

A single analytics script can drop a Lighthouse score by 20 points ([DEV Community](https://dev.to/steve8708/comment/1idn5)). Onboarding tools run similar initialization patterns.

## Why onboarding tool performance matters

The 2025 Web Almanac found the median mobile page already carries a Total Blocking Time of 1,916ms, nearly 10x the 200ms target. Adding another third-party script to that stack moves you further from every Core Web Vitals threshold.

Slow onboarding flows increase drop-off. If a tooltip takes 300ms to appear after a click because the onboarding tool is still initializing, users notice. They don't file bug reports about it. They just leave.

## How SaaS onboarding tools affect your scores

### The main thread tax

The [2025 Web Almanac](https://almanac.httparchive.org/en/2025/performance) reports that mobile pages have a median TBT of 1,916ms. The [Chrome Aurora team found](https://www.debugbear.com/blog/reduce-the-impact-of-third-party-code) that a Google Tag Manager container with 18 tags increases TBT nearly 20x.

### The CDN dependency

Client-side libraries ship as npm packages bundled into your app. SaaS tools load from a vendor CDN at runtime, creating a single point of failure. [Smashing Magazine documented a case](https://www.smashingmagazine.com/2022/06/dont-sink-website-third-parties/) where a third-party font service failure pushed FCP from under 2 seconds to over 30 seconds.

### The transparency gap

| Tool | Payload (gzipped) | Auditable? | CDN dependency |
|------|-------------------|------------|---------------|
| Tour Kit core | <8 KB | Yes (npm, bundlephobia) | No |
| Driver.js | ~5 KB | Yes (npm) | No |
| React Joyride | ~25 KB | Yes (npm) | No |
| Shepherd.js | ~35 KB | Yes (npm) | No |
| Appcues | Not published | No | Yes |
| Pendo | Not published | No | Yes |
| WalkMe | Not published | No | Yes |
| Whatfix | Not published | No | Yes |
| Userpilot | Not published | No | Yes |
| Chameleon | Not published | No | Yes |
| UserGuiding | Not published | No | Yes |

No SaaS vendor publishes their bundle size. That asymmetry tells you something about the numbers.

## The "just load it async" myth

Dave Rupert wrote on [CSS-Tricks](https://css-tricks.com/hard-costs-of-third-party-scripts/): "Every client I have averages ~30 third-party scripts." Async loading doesn't eliminate the cost. It shifts it to the main thread after load.

TBT carries 30% of the Lighthouse score and INP carries 10%. Async loading moves the penalty from FCP (10% weight) to a 40% combined weight. That's a worse trade.

## Measuring the impact yourself

```bash
# 1. Disable your onboarding tool
# 2. Run Lighthouse CLI (5 runs, median)
npx lighthouse https://your-app.com --runs=5 --output=json

# 3. Re-enable the onboarding tool and run again
npx lighthouse https://your-app.com --runs=5 --output=json

# 4. Compare TBT, LCP, INP, and overall score
```

## The client-side library alternative

```tsx
import { TourProvider, useTour } from '@tourkit/react';

function App() {
  return (
    <TourProvider
      steps={[
        { target: '#feature-button', content: 'Click here to start' },
        { target: '#settings-panel', content: 'Configure your workspace' },
      ]}
    >
      <Dashboard />
    </TourProvider>
  );
}

// Tree-shakes to only the components you use
const TourOverlay = React.lazy(() => import('./TourOverlay'));
```

Tour Kit's core ships at under 8KB gzipped with zero runtime dependencies. No CDN request, no remote config fetch, no DOM polling loop.

**Honesty check:** client-side libraries require your developers to write code. Tour Kit has no visual builder. You need React 18+ and developers comfortable with JSX.

## A practical performance budget

| Approach | JS cost | Network requests | Main thread impact |
|----------|---------|------------------|--------------------|
| Tour Kit (lazy-loaded) | <8 KB (in bundle) | 0 additional | Negligible |
| SaaS tool (async) | Unknown + config fetch | 2-5 additional | 50-300ms TBT |
| SaaS tool (sync) | Unknown + config fetch | 2-5 additional | 200-500ms+ TBT |

[Opera's research](https://www.smashingmagazine.com/2022/06/dont-sink-website-third-parties/) showed pages render 51% faster when third-party scripts are blocked.

---

Full article with all data points: [usertourkit.com/blog/onboarding-tool-lighthouse-performance](https://usertourkit.com/blog/onboarding-tool-lighthouse-performance)
