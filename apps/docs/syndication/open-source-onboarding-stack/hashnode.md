---
title: "The open-source onboarding stack: build your own with code"
slug: "open-source-onboarding-stack"
canonical: https://usertourkit.com/blog/open-source-onboarding-stack
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/open-source-onboarding-stack)*

# The open-source onboarding stack: build your own with code

Most teams treat onboarding as a single tool decision. Pick Appcues or Pendo, drop in a script tag, let product managers drag and drop. It works until the quarterly invoice arrives at $15,000, your tours load 300KB of vendor JavaScript, and every tooltip change requires a Jira ticket because the visual builder can't reach your custom components.

There's a third option between building from scratch and buying a SaaS platform. You assemble a stack from open-source libraries, the same way you'd pick a database, a UI library, and an analytics tool. Each layer does one thing. You own everything.

This guide maps every layer of that stack, compares the libraries worth considering in each one, and shows you how to wire them together. We built [Tour Kit](https://usertourkit.com/) as the guidance layer of this stack, so take our recommendations with appropriate skepticism.

```bash
npm install @tourkit/core @tourkit/react
```

## The five layers of an open-source onboarding stack

| Layer | What it does | Examples |
|-------|-------------|----------|
| Guidance | Product tours, tooltips, hints, checklists | Tour Kit, Shepherd.js, Driver.js |
| Analytics | Track completion, drop-off, activation | PostHog, Plausible, Umami |
| Feature flags | Target tours to segments and run experiments | PostHog, GrowthBook, Flagsmith |
| Feedback | NPS, CSAT, CES surveys after tours | Tour Kit Surveys, Formbricks |
| UI | Render tour steps with your design system | shadcn/ui, Radix UI |

## Three types of onboarding architecture

**1. SaaS platform:** Fast to start, expensive to scale ($249-$8,000+/month), tightly coupled.

**2. Build from scratch:** Full control, but $60,000-$200,000 to build plus 15-20% annual maintenance.

**3. Open-source composable stack:** Zero licensing cost, full ownership, skip the infrastructure work that maintained libraries already solved.

## The guidance layer comparison

| Library | License | Size (gzipped) | React 19 | Headless | TypeScript |
|---------|---------|----------------|----------|----------|------------|
| Tour Kit | MIT | <8KB (core) | ✅ | ✅ | ✅ strict |
| Shepherd.js | MIT | ~38KB | ⚠️ wrapper | ❌ | ✅ |
| Driver.js | MIT | ~5KB | ⚠️ vanilla | ❌ | ✅ |
| React Joyride | MIT | ~37KB | ❌ | ❌ | ⚠️ partial |
| OnboardJS | MIT | ~6KB | ✅ | ✅ | ✅ |

React Joyride has 400K+ weekly downloads but hasn't been updated in nine months and doesn't support React 19. Teams upgrading need alternatives now.

## Wiring the layers together

```tsx
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

Total bundle: under 55KB gzipped (Tour Kit + PostHog SDK). A single SaaS onboarding tool adds 150-400KB.

## When NOT to build a stack

Choose SaaS if your product team needs visual tour editing without deploying code, or if you don't have React developers available. Tour Kit requires React 18+ and TypeScript. No visual builder, no drag-and-drop.

---

Full article with detailed layer comparisons, cost analysis, and more code examples: [usertourkit.com/blog/open-source-onboarding-stack](https://usertourkit.com/blog/open-source-onboarding-stack)
