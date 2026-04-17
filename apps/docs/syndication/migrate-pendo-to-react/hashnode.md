---
title: "How to export Pendo tours to a self-owned React solution"
slug: "migrate-pendo-to-react"
canonical: https://usertourkit.com/blog/migrate-pendo-to-react
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-pendo-to-react)*

# How to export Pendo tours to a self-owned React solution

You're paying Pendo $40K-$80K a year for product tours. Your React app has grown. The guides take 54KB of third-party JavaScript on every page load, your SPA throws `pendo is undefined` errors after navigation, and your design team gave up trying to match your Tailwind tokens inside Pendo's theme editor.

This isn't a "Pendo is bad" article. Pendo does analytics, session replay, and NPS surveys across web and mobile. But if your primary use case is in-app guides and you have a React codebase, owning that code eliminates a six-figure annual dependency and gives you full control over rendering, accessibility, and data.

This guide walks you through exporting your Pendo guide configurations, rebuilding them as React components with [Tour Kit](https://usertourkit.com), and removing the Pendo snippet. Budget 3-5 hours for a typical setup with 5-10 guides.

**Bias disclosure:** We built Tour Kit. Every claim below is verifiable against npm, GitHub, and Pendo's own documentation.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate away from Pendo guides?

As of April 2026, mid-market Pendo customers pay $40K-$80K annually with 5-20% renewal increases. Teams migrate when the guides portion of that cost stops justifying the price.

Technical pain points:

- **SPA routing friction.** Pendo uses `window.pendo.initialize` and DOM mutation observers. React's client-side routing causes "page mismatch" errors
- **54KB third-party script** on every page. Tour Kit's core is under 8KB gzipped
- **Design system conflicts.** Pendo's theme editor constrains you to their CSS variables
- **Accessibility gaps.** Pendo claims WCAG 2.2 AA but admits they're "in the process" of full compliance
- **Data lock-in.** Full data export requires the Ultimate tier at $100K+/year

## The migration in 6 steps

1. **Export Pendo guide configs** via their REST API (`/api/v1/guide`)
2. **Install Tour Kit alongside Pendo** (both coexist without conflicts)
3. **Rebuild guides as React components** using `<Tour>`, `<TourStep>`, and `<TourCard>`
4. **Convert targeting rules** from Pendo segments to React conditionals
5. **Migrate badges** from Pendo hotspots to `@tour-kit/hints`
6. **Disable Pendo guides, then remove the snippet** after one sprint of parallel testing

## Key code: rebuilding a guide

```tsx
import { Tour, TourStep, TourCard, TourOverlay } from '@tourkit/react';

const steps = [
  { id: 'welcome', target: '[data-pendo="dashboard-header"]', title: 'Welcome', content: 'Track your key metrics here.' },
  { id: 'metrics', target: '[data-pendo="metrics-panel"]', title: 'Metrics', content: 'Revenue and churn update in real time.' },
  { id: 'actions', target: '[data-pendo="quick-actions"]', title: 'Quick actions', content: 'Export reports or invite teammates.' },
];

export function DashboardTour() {
  return (
    <Tour tourId="dashboard-tour" steps={steps}>
      <TourOverlay />
      <TourStep>
        {({ step, next, prev, stop, currentIndex, totalSteps }) => (
          <TourCard>
            <TourCard.Header>
              <TourCard.Title>{step.title}</TourCard.Title>
              <TourCard.Close onClick={stop} />
            </TourCard.Header>
            <TourCard.Body>{step.content}</TourCard.Body>
            <TourCard.Footer>
              <TourCard.Progress current={currentIndex + 1} total={totalSteps} />
            </TourCard.Footer>
          </TourCard>
        )}
      </TourStep>
    </Tour>
  );
}
```

## What you gain and lose

| Dimension | Pendo | Tour Kit |
|-----------|-------|----------|
| Annual cost | $40K-$80K | $0 (MIT) or $99 one-time |
| Bundle size | 54KB | <8KB gzipped |
| Guide creation | Visual builder, no-code | React components, requires devs |
| Accessibility | "In process" WCAG 2.2 AA | WCAG 2.1 AA built-in |
| Data ownership | Pendo servers | Your infrastructure |
| Mobile | iOS + Android SDK | Web only |

Full article with API export commands, targeting conversion examples, troubleshooting, and FAQ: [usertourkit.com/blog/migrate-pendo-to-react](https://usertourkit.com/blog/migrate-pendo-to-react)
