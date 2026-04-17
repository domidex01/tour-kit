---
title: "Stop paying $5K/month for onboarding — assemble your own open-source stack"
published: false
description: "A composable open-source onboarding stack gives you tours, analytics, feature flags, and surveys without vendor lock-in. Here's every layer, compared."
tags: react, opensource, webdev, tutorial
canonical_url: https://usertourkit.com/blog/open-source-onboarding-stack
cover_image: https://usertourkit.com/og-images/open-source-onboarding-stack.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/open-source-onboarding-stack)*

# The open-source onboarding stack: build your own with code

Most teams treat onboarding as a single tool decision. Pick Appcues or Pendo, drop in a script tag, let product managers drag and drop. It works until the quarterly invoice arrives at $15,000, your tours load 300KB of vendor JavaScript, and every tooltip change requires a Jira ticket because the visual builder can't reach your custom components.

There's a third option between building from scratch and buying a SaaS platform. You assemble a stack from open-source libraries, the same way you'd pick a database, a UI library, and an analytics tool. Each layer does one thing. You own everything.

This guide maps every layer of that stack, compares the libraries worth considering in each one, and shows you how to wire them together. We built [Tour Kit](https://usertourkit.com/) as the guidance layer of this stack, so take our recommendations with appropriate skepticism. Every claim below is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## What is an open-source onboarding stack?

An open-source onboarding stack is a composable set of libraries and tools that handle user onboarding through code you control, rather than through a vendor's hosted platform. Think of it like the T3 stack or JAMstack: instead of one monolithic tool, you pick the best library for each concern and wire them together.

The typical stack has five layers:

| Layer | What it does | Examples |
|-------|-------------|----------|
| Guidance | Product tours, tooltips, hints, checklists | Tour Kit, Shepherd.js, Driver.js |
| Analytics | Track completion, drop-off, activation | PostHog, Plausible, Umami |
| Feature flags | Target tours to segments and run experiments | PostHog, GrowthBook, Flagsmith |
| Feedback | NPS, CSAT, CES surveys after tours | Tour Kit Surveys, Formbricks |
| UI | Render tour steps with your design system | shadcn/ui, Radix UI, your components |

SaaS platforms like Appcues bundle all five layers into one product. That's convenient, but it means you get their analytics dashboard (not yours), their targeting logic (not your feature flags), and their UI (not your design tokens). The open-source stack gives you the same capabilities without the coupling.

## Three types of onboarding architecture

Every team faces the same question: how do we get users from signup to activation? The answer falls into one of three categories, each with different tradeoffs in cost, control, and maintenance burden.

**1. SaaS platform (Appcues, Pendo, Userpilot):** A hosted product that product managers control through a visual builder. Fast to start, expensive to scale, tightly coupled to the vendor's UI and data model. Monthly costs range from $249 (Appcues starter) to $8,000+ (enterprise Pendo).

**2. Build from scratch:** Your engineering team writes the entire tour engine, positioning logic, analytics integration, and admin tooling. Full control, but Userpilot estimates $60,000 for a startup build and maintenance runs 15-20% of original cost per year ([Userpilot](https://userpilot.com/blog/build-vs-buy-user-onboarding/)).

**3. Open-source composable stack:** You pick maintained libraries for each layer (guidance, analytics, flags, surveys) and wire them together. Zero licensing cost, full ownership, and you skip the hard infrastructure work (positioning engines, scroll handling, focus trapping) that the libraries already solved.

## Why build a stack instead of buying a platform?

The default advice is "buy a platform, save engineering time." That math checks out for some teams. But the advice underestimates the ongoing cost of SaaS, the hidden cost of not owning your onboarding code, and the overhead of maintaining a vendor integration.

### The cost argument is more complicated than "buy saves time"

Building onboarding from scratch costs real money. Userpilot's analysis estimates $60,000 for a startup (two-month build), $200,000 for a mid-market team (six to twelve months), and Atlassian reportedly spent $3.5 million over three years ([Userpilot](https://userpilot.com/blog/build-vs-buy-user-onboarding/)). Nobody disputes this.

But buying isn't cheap either. Appcues starts at $249/month and scales with MAU. At 10,000 MAU, you're spending $3,000-5,000/month. Pendo's enterprise contracts run $36,000-96,000/year. And as one analysis noted, "enterprise buyers discover sticker price represents only 40-60% of total cost" once you factor in implementation, training, and integration work.

The open-source stack sits in the middle. You spend zero on licensing and invest engineering time in assembly rather than building from scratch. The key difference: you're wiring together maintained libraries, not writing a tooltip positioning engine.

### Vendor lock-in is real and expensive to escape

Once your product managers have built 50 tours in a visual builder, migration isn't a weekend project. Tour definitions live in the vendor's database. Analytics history lives in their dashboard. Targeting rules are expressed in their proprietary format.

With a code-first stack, tours are React components in your repo. Analytics flow through your own PostHog or Mixpanel instance. Targeting uses your feature flag system. There's nothing to migrate because there's no vendor database.

### Performance compounds when you own the bundle

SaaS onboarding tools inject third-party JavaScript. Lighthouse audits show they add 150-400KB to your bundle and 200-800ms to Time to Interactive. That's on every page load, not just pages with tours.

An open-source stack lets you tree-shake aggressively. Tour Kit's core ships at under 8KB gzipped with zero runtime dependencies. You load the guidance layer only on pages that need it, using `React.lazy` and code-splitting.

## The guidance layer: choosing a tour library

The guidance layer is the core of your onboarding stack. It handles product tours, tooltips, hotspots, checklists, and step-by-step walkthroughs. As of April 2026, over a dozen open-source options exist, but only a handful are actively maintained and compatible with modern React.

| Library | License | Size (gzipped) | React 19 | Headless | TypeScript |
|---------|---------|----------------|----------|----------|------------|
| Tour Kit | MIT | <8KB (core) | ✅ | ✅ | ✅ strict |
| Shepherd.js | MIT | ~38KB | ⚠️ wrapper | ❌ | ✅ |
| Driver.js | MIT | ~5KB | ⚠️ vanilla | ❌ | ✅ |
| React Joyride | MIT | ~37KB | ❌ | ❌ | ⚠️ partial |
| OnboardJS | MIT | ~6KB | ✅ | ✅ | ✅ |
| Intro.js | AGPL/Commercial | ~12KB | ❌ | ❌ | ⚠️ partial |

### What "headless" means for tour libraries

A headless tour library separates the tour logic (step progression, positioning, state management) from the UI rendering. You get hooks like `useTour()` and `useStep()` that tell you what to render and where. You bring your own components.

This matters because your onboarding UI should match your product's design system. If you use shadcn/ui or Tailwind, you don't want a library that injects its own CSS. Headless means your tooltips, modals, and highlights are your components, styled with your tokens.

### The React 19 compatibility problem

React Joyride has over 400,000 weekly npm downloads, making it the most popular React tour library by a wide margin. But it hasn't been updated in nine months and doesn't support React 19's concurrent features.

Tour Kit was built for React 18 and 19 from the start. OnboardJS also supports React 19. Shepherd.js works through a community-maintained React wrapper, which introduces its own compatibility concerns.

### Beyond tours: the full guidance toolkit

Most teams need more than linear step-by-step tours. Real onboarding includes:

- **Hotspots and hints** that pulse on undiscovered features
- **Checklists** that track onboarding progress with task dependencies
- **Announcements** for feature releases: modals, banners, toasts, slideouts
- **Empty states** that guide users when there's no data yet

Tour Kit provides all of these as separate packages you install only when needed: `@tour-kit/hints`, `@tour-kit/checklists`, `@tour-kit/announcements`. Other libraries only handle tours, which means you're building or buying the rest separately.

## The analytics layer: measuring what matters

An onboarding stack without analytics is a tour that runs but never improves. You need to track tour completion rates, step drop-off points, and how onboarding correlates with activation and retention.

### PostHog: the natural companion

PostHog is the most complete open-source analytics platform: product analytics, session replay, feature flags, A/B testing, and surveys in a single self-hosted deployment. But as Userpilot noted in their review, "PostHog excels at analytics but cannot act directly on insights through in-app guidance or user onboarding flows."

That limitation is exactly the gap a tour library fills. Wire Tour Kit's analytics package to PostHog:

```tsx
// src/providers/tour-analytics.tsx
import { TourKitProvider } from '@tourkit/react';
import { PostHogAnalyticsPlugin } from '@tourkit/analytics';
import posthog from 'posthog-js';

const analyticsPlugin = PostHogAnalyticsPlugin({
  client: posthog,
  trackStepViewed: true,
  trackTourCompleted: true,
  trackStepDuration: true,
});

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider plugins={[analyticsPlugin]}>
      {children}
    </TourKitProvider>
  );
}
```

Every tour event flows into PostHog's event stream. Build funnels and cohort analyses in the same tool your product team already uses. Add retention curves to see long-term impact.

### Alternatives to PostHog

Not every team wants PostHog's full platform. Lighter options:

- **Plausible** for privacy-first tour tracking (AGPL, self-hosted, GDPR-native)
- **Google Analytics 4** for teams already running GA
- **Mixpanel** for funnel analysis with its free tier
- **Amplitude** for retention analysis at scale

Tour Kit's analytics package uses a plugin architecture, so you wire up whichever backend fits your stack. Or track events through Segment and pipe them to multiple destinations.

## The feature flags layer: targeting the right users

Showing the same tour to every user is the number one product tour antipattern. New signups need a full walkthrough. Returning users need feature announcements. Admin users need different flows than viewers.

Your onboarding stack should read targeting state from your existing feature flag system, not maintain a parallel one. The pattern:

```tsx
import { useTour } from '@tourkit/react';
import { useFeatureFlag } from 'posthog-js/react';

function OnboardingRouter() {
  const showAdvancedTour = useFeatureFlag('advanced-onboarding');
  const { start } = useTour();

  useEffect(() => {
    if (showAdvancedTour) {
      start('power-user-tour');
    } else {
      start('new-user-tour');
    }
  }, [showAdvancedTour, start]);

  return null;
}
```

Open-source feature flag options include PostHog (built-in), GrowthBook (MIT, data warehouse native), and Flagsmith (BSD-3).

## Assembling the stack: a reference architecture

Here's the complete open-source onboarding stack we recommend:

| Layer | Recommended | Alternative | License |
|-------|------------|-------------|---------|
| Tours + Hints | Tour Kit | Shepherd.js, OnboardJS | MIT |
| Checklists | Tour Kit Checklists | Custom (hooks are ~200 LOC) | MIT |
| Announcements | Tour Kit Announcements | Custom modal/toast | MIT |
| Analytics | PostHog | Plausible, Umami | MIT / AGPL |
| Feature flags | PostHog (built-in) | GrowthBook, Flagsmith | MIT / Apache |
| Surveys | Tour Kit Surveys | Formbricks | MIT / AGPL |
| UI | shadcn/ui | Radix UI, your components | MIT |
| State | Zustand | Jotai, Redux Toolkit | MIT |
| Testing | Playwright + Vitest | Cypress + Jest | Apache / MIT |

### Installation for the recommended stack

```bash
# Guidance layer
npm install @tourkit/core @tourkit/react @tourkit/hints @tourkit/checklists

# Analytics layer
npm install @tourkit/analytics posthog-js

# Surveys (optional)
npm install @tourkit/surveys

# Announcements (optional)
npm install @tourkit/announcements
```

Total bundle cost for the full Tour Kit guidance layer: under 30KB gzipped. Compare that to the 150-400KB that a single SaaS script tag adds.

### Wiring the layers together

```tsx
// src/app/providers.tsx
import { TourKitProvider } from '@tourkit/react';
import { ChecklistProvider } from '@tourkit/checklists';
import { PostHogAnalyticsPlugin } from '@tourkit/analytics';
import { SurveyProvider } from '@tourkit/surveys';
import posthog from 'posthog-js';

const analytics = PostHogAnalyticsPlugin({ client: posthog });

export function OnboardingStack({ children }: { children: React.ReactNode }) {
  return (
    <TourKitProvider plugins={[analytics]}>
      <ChecklistProvider>
        <SurveyProvider>
          {children}
        </SurveyProvider>
      </ChecklistProvider>
    </TourKitProvider>
  );
}
```

Each provider is optional. Install `@tourkit/checklists` only if you use checklists. Skip `@tourkit/surveys` if you run Formbricks. The composable architecture means you never pay for layers you don't use.

## When not to build a stack

The open-source onboarding stack works best for teams with React developers who own the frontend and want full control over their onboarding experience, data, and bundle size. It's not the right choice for every team, and pretending otherwise would be dishonest.

**Choose a SaaS platform when:**
- Your product team needs to create and edit tours without deploying code
- You don't have a frontend developer available for onboarding work
- You need enterprise features like role-based access to the tour builder
- Speed to first tour matters more than long-term ownership

**Choose the open-source stack when:**
- You have React developers who own the frontend
- Your design system demands pixel-perfect tour styling
- You run your own analytics (PostHog, Plausible, or similar)
- You want to avoid per-MAU pricing that scales with success
- Data ownership and GDPR compliance are requirements

Tour Kit requires React 18+ and TypeScript developers. There's no visual builder, no drag-and-drop, and the community is smaller than React Joyride's or Shepherd.js's install base.

## FAQ

### Is an open-source onboarding stack really free?

The license cost is zero. Tour Kit is MIT, PostHog is MIT, GrowthBook is MIT. The real cost is developer time for assembly and maintenance. For teams with React developers on staff, that investment is far lower than building from scratch ($60,000+ per Userpilot's estimates) or paying SaaS pricing ($3,000-15,000/month at scale).

### What's the total bundle size of the full stack?

Tour Kit's full guidance layer ships under 30KB gzipped. PostHog's SDK adds 20-25KB gzipped. Combined: under 55KB for your entire open-source onboarding stack. Compare that to 150-400KB for a single SaaS onboarding script tag.

### Does this stack work with Next.js App Router?

Yes. Tour Kit handles the server/client component boundary with a `'use client'` boundary in its React package. It works with both Pages Router and App Router patterns.

---

*Full article with all comparison tables and code examples at [usertourkit.com/blog/open-source-onboarding-stack](https://usertourkit.com/blog/open-source-onboarding-stack)*
