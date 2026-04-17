---
title: "Which onboarding tool actually has a free tier? We tested 10"
published: false
description: "We compared free plans across 10 SaaS onboarding tools and 8 open-source libraries. Most 'free' tools are just trials. Here's what's genuinely free and what you give up."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/onboarding-tool-best-free-tier
cover_image: https://usertourkit.com/og-images/onboarding-tool-best-free-tier.png
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

Not all free plans are created equal. Some tools advertise "free" but mean a 14-21 day trial. The table below separates genuine free-forever plans from trials.

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
| WalkMe | SaaS | No | -- | -- | Enterprise ~$10K+/yr |
| Whatfix | SaaS | No | -- | -- | Enterprise ~$10K+/yr |
| Tour Kit | Open source | Yes (MIT, forever) | No limit | Unlimited | React 18+ only, no visual builder |
| React Joyride | Open source | Yes (MIT) | No limit | Unlimited | Inline styles only, 37KB gzipped |
| Shepherd.js | Open source | AGPL (paid for commercial) | No limit | Unlimited | $50-$300 commercial license |
| Intro.js | Open source | AGPL (paid for commercial) | No limit | Unlimited | $9.99-$299 commercial, maintenance mode |
| Driver.js | Open source | Yes (MIT) | No limit | Unlimited | Limited for complex onboarding |

Sources: Vendor pricing pages accessed April 2026.

## How to decide: the if/then framework

Two variables determine the right choice: your team's technical ability and your current MAU count.

**If your team has React developers and wants full design control:**
Use Tour Kit. The MIT-licensed core (under 8KB gzipped) gives you headless tour logic, and you render steps with your own components. Works with shadcn/ui, Radix, Tailwind, or any design system. No MAU limits. No vendor lock-in.

**If you need a no-code tool and have under 5,000 MAU:**
Product Fruits is the strongest SaaS free tier. Unlimited tours, 5,000 MAU cap, no trial countdown. That's 50x the MAU cap of UserGuiding's free plan.

**If you need analytics bundled with onboarding and have under 500 MAU:**
Pendo Free includes basic analytics and NPS alongside guides. But the jump from free to paid is the steepest in the industry. Pendo's enterprise pricing starts around $15,000/year.

**If you're a startup with fewer than 1,000 MAU and want quick setup:**
Userflow's free plan offers unlimited tours and steps for 1,000 MAU with a single seat. Chameleon gives you 1,000 MAU too, but caps you at 10 experiences.

**If budget is zero and you need something framework-agnostic:**
Driver.js (MIT, zero dependencies) or React Joyride (MIT, React-only, 7,600 GitHub stars as of April 2026) are both genuinely free. Neither offers built-in accessibility compliance or headless rendering, though.

**If accessibility compliance is non-negotiable:**
Shepherd.js has the strongest WCAG support among established libraries, with keyboard navigation, focus trapping, and ARIA attributes out of the box. Tour Kit is built WCAG 2.1 AA compliant by default with Lighthouse accessibility scores of 100.

## The hidden cost of "free" SaaS tiers

A free SaaS onboarding tier looks attractive until you hit the wall. And you will hit the wall.

Every SaaS tool in our comparison uses MAU-based pricing. Chameleon's free plan covers 1,000 MAU. Cross 1,001 and you're looking at $249-$299/month for the Growth plan. That's $0 to $3,000+/year triggered by a single new user.

The features you depend on in the free tier (tour configurations, targeting rules, analytics history) live on the vendor's servers. Switch tools and you rebuild from scratch.

Open-source libraries avoid the MAU cliff entirely. Your tour code lives in your repo. Your data stays in your analytics stack. But open source has its own hidden cost: engineering time.

Tour Kit's approach splits the difference. The core packages (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) are MIT-licensed and permanently free. Extended packages for analytics, checklists, and surveys are available as a one-time $99 Pro license. No MAU limits on either tier.

## What no other comparison mentions: accessibility

We searched 15 "best free onboarding tool" articles across the first three pages of Google results. Zero of them evaluated WCAG compliance. Not one.

This matters because onboarding tours overlay your app's UI, trap focus, and inject dynamic content. Those are exactly the patterns that break screen readers when done wrong.

Shepherd.js is the only established open-source library that explicitly documents WCAG support. Tour Kit is built with WCAG 2.1 AA compliance as a core requirement, not an afterthought. Focus management, keyboard navigation, screen reader announcements, and `prefers-reduced-motion` support ship in the base package.

## What we'd actually recommend (and why)

For most developer teams, the honest answer is Tour Kit's free tier. Not because we built it, but because the combination of MIT license, zero MAU restrictions, headless architecture, and built-in accessibility doesn't exist elsewhere in one package.

The tradeoff is real. Tour Kit requires React 18+ and developers who can write JSX. There's no visual builder, and the community is smaller than React Joyride's. If your team doesn't have React experience, Product Fruits (5,000 MAU free) or Userflow (1,000 MAU free) are the practical SaaS choices.

```tsx
// src/components/OnboardingTour.tsx
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

That's a working tour in 15 lines. No MAU counter ticking in the background.

Get started at [usertourkit.com](https://usertourkit.com/), or install directly:

```bash
npm install @tourkit/core @tourkit/react
```

## FAQ

### Is there a truly free onboarding tool with no limits?

Open-source MIT-licensed libraries like Tour Kit, React Joyride, and Driver.js have no MAU limits and no trial expirations. Tour Kit ships tours, hints, and focus management in its free tier under 20KB gzipped total.

### Which SaaS onboarding tool has the highest free MAU limit?

As of April 2026, Product Fruits offers the highest free MAU cap at 5,000 users with unlimited tours. Userflow, Chameleon, and CommandBar cap free plans at 1,000 MAU. Pendo Free allows 500 MAU.

### What happens when I outgrow a free onboarding tool?

SaaS tools force a paid upgrade once you exceed the MAU cap. Chameleon goes from $0 to $249/month, Appcues starts at $249/month with no free tier at all, and Pendo jumps from free to $15,000+/year. Open-source tools like Tour Kit avoid this entirely.

### Do free onboarding tools support accessibility?

Most free onboarding tools don't document accessibility compliance. Shepherd.js is the exception among open-source libraries, with built-in keyboard navigation and ARIA support. Tour Kit ships WCAG 2.1 AA compliance in its free MIT tier.

### Should I use a free SaaS tool or an open-source library?

Use a free SaaS tool if your team doesn't write code and you have fewer than 1,000 MAU. Use an open-source library if you have developers, want full UI control, and need to avoid vendor lock-in. Tour Kit offers an MIT-licensed headless core with optional Pro packages at $99 one-time.
