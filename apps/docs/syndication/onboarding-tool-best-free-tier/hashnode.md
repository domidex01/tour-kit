---
title: "Which onboarding tool has the best free tier?"
slug: "onboarding-tool-best-free-tier"
canonical: https://usertourkit.com/blog/onboarding-tool-best-free-tier
tags: react, javascript, web-development, opensource
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-tool-best-free-tier)*

# Which onboarding tool has the best free tier?

"Free" shows up on every onboarding tool's pricing page. Sometimes it means a permanent plan with real feature access. Sometimes it means 14 days before a credit card prompt. And sometimes it means an AGPL license that your legal team won't approve.

We tested free plans across 10 SaaS onboarding tools and 8 open-source libraries. The real question isn't "which tool is free." It's which one stays free long enough to matter.

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit's core packages are MIT-licensed and free permanently with no MAU cap. [See the docs](https://usertourkit.com/) to get started in under five minutes.

**Bias disclosure:** We built Tour Kit, so take our perspective with appropriate skepticism. Every data point below is verifiable against npm, GitHub, or the vendor's public pricing page.

## Short answer

The onboarding tool with the best free tier depends on your team's technical ability. For non-technical teams, Product Fruits offers 5,000 MAU with unlimited tours at no cost, the highest free cap of any SaaS tool as of April 2026. For developers who can write React components, Tour Kit gives you an MIT-licensed onboarding stack with zero MAU restrictions and under 20KB gzipped total. Pendo Free works if you need basic analytics at 500 MAU, but the jump to enterprise pricing ($15,000+/year) is steep.

## Every "free" onboarding tool, compared

| Tool | Type | Free plan? | MAU limit | Tours | Key restriction |
|------|------|-----------|-----------|-------|-----------------|
| Product Fruits | SaaS | Yes (forever) | 5,000 | Unlimited | Limited integrations |
| Userflow | SaaS | Yes (forever) | 1,000 | Unlimited | 1 seat, no custom CSS |
| CommandBar | SaaS | Yes (forever) | 1,000 | Core tours | Growth plan $250/mo |
| Chameleon | SaaS | Yes (forever) | 1,000 | 10 experiences | No A/B testing |
| Pendo | SaaS | Yes (forever) | 500 | Basic guides | No segmentation, no A/B |
| UserGuiding | SaaS | Yes (forever) | 100 | Unlimited | No custom CSS, no A/B |
| Appcues | SaaS | No (21-day trial) | -- | -- | Starter $249/mo |
| Userpilot | SaaS | No (14-day trial) | -- | -- | Starter $249/mo |
| Tour Kit | Open source | Yes (MIT, forever) | No limit | Unlimited | React 18+ only, no visual builder |
| React Joyride | Open source | Yes (MIT) | No limit | Unlimited | Inline styles only, 37KB gzipped |
| Shepherd.js | Open source | AGPL (paid commercial) | No limit | Unlimited | $50-$300 commercial license |

## How to decide: the if/then framework

**React developers wanting design control:** Tour Kit. MIT core under 8KB gzipped, headless, works with shadcn/ui and Tailwind. No MAU limits.

**No-code team under 5,000 MAU:** Product Fruits. Strongest SaaS free tier.

**Need analytics at under 500 MAU:** Pendo Free. But enterprise pricing ($15,000+/year) kicks in fast.

**Startup under 1,000 MAU:** Userflow (unlimited tours, 1 seat) or Chameleon (10 experiences).

**Accessibility required:** Shepherd.js or Tour Kit. Both ship WCAG support. Tour Kit scores Lighthouse 100.

## The hidden cost of "free" SaaS tiers

Every SaaS tool uses MAU-based pricing. Cross 1,001 MAU on Chameleon and you're at $249-$299/month overnight.

Tour Kit splits the difference: MIT core packages are permanently free, extended packages (analytics, checklists, surveys) are $99 one-time. No MAU limits on either tier.

## What we'd recommend

For developer teams: Tour Kit's free tier. MIT license, zero MAU restrictions, headless architecture, WCAG 2.1 AA built in.

For non-technical teams: Product Fruits (5,000 MAU free) or Userflow (1,000 MAU free).

```tsx
import { TourProvider, Tour, TourStep } from '@tourkit/react';

export function OnboardingTour() {
  return (
    <TourProvider>
      <Tour tourId="welcome">
        <TourStep target="#dashboard-nav" title="Your dashboard">
          Everything you need starts here.
        </TourStep>
        <TourStep target="#create-button" title="Create your first project">
          Click here to get started with your first project.
        </TourStep>
      </Tour>
    </TourProvider>
  );
}
```

Get started at [usertourkit.com](https://usertourkit.com/) or `npm install @tourkit/core @tourkit/react`.
