---
title: "Replacing Userpilot with open-source: Tour Kit + PostHog migration guide"
published: false
description: "Step-by-step migration from Userpilot ($799/mo) to Tour Kit + PostHog. API mapping table, TypeScript code examples, cost breakdown, and troubleshooting."
tags: react, javascript, opensource, tutorial
canonical_url: https://usertourkit.com/blog/migrate-userpilot-tour-kit-posthog
cover_image: https://usertourkit.com/og-images/migrate-userpilot-tour-kit-posthog.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-userpilot-tour-kit-posthog)*

# Migrating from Userpilot to Tour Kit + PostHog

Your Userpilot contract renewal is coming up. The Growth plan costs $799/month as of April 2026, and your team already pays for PostHog (or Mixpanel, or Amplitude) for product analytics. You're paying twice for event tracking you only use once.

That's the pattern we keep hearing from teams who migrate. Userpilot bundles analytics, session tracking, in-app guidance into one platform. The problem is most engineering teams already have better analytics elsewhere. You end up with two dashboards and two bills.

Tour Kit is a headless React product tour library (core under 8KB gzipped) that handles the onboarding UX layer: tours, hints, checklists, and surveys. PostHog handles analytics and experimentation: event tracking, funnels, session replays, feature flags. Together they replace Userpilot at a fraction of the cost, with full control over your code and data.

**Bias disclosure:** We built Tour Kit. Every claim below is verifiable against npm and GitHub.

```bash
npm install @tourkit/core @tourkit/react posthog-js
```

## Why migrate from Userpilot?

Userpilot has a 4.6/5 rating on G2 with 905 reviews as of April 2026. It's a solid product with a visual flow builder and built-in analytics. Teams don't leave because Userpilot is bad. They leave because the architecture creates friction that compounds over time.

Here are the specific pain points from G2 reviews and Reddit threads that push engineering teams toward open source:

- **Analytics duplication.** Userpilot bundles product analytics, but your team already uses PostHog, Amplitude, or Mixpanel. You're maintaining two event pipelines for the same data. One G2 reviewer wrote: "Custom reports could be more flexible. I can't slice and dice data exactly as I would like" ([UserGuiding compilation](https://userguiding.com/blog/userpilot-reviews)).

- **Cost at scale.** Starter at $299/month gets you 2,000 MAU and only 10 feature tags. Growth jumps to $799/month. Average Growth plan cost runs ~$8,500/year according to Vendr data. That's $8,500 for onboarding flows you could own outright.

- **SPA friction.** Userpilot requires calling `userpilot.reload()` on every URL change in React, Vue, or Angular apps. It's a script-injection architecture, not a component model. Miss a `reload()` call and your tour silently breaks.

- **Limited customization.** Multiple G2 reviewers flag this: "Hard to target specific elements or get the flow to pop up...You need to test it a lot." If your app uses dynamic layouts or portals, Userpilot's element targeting breaks easily.

- **Mobile gaps.** One reviewer described the mobile experience as "more like a minimized desktop app rather than native." Tour Kit's headless approach means you render whatever responsive UI your app already uses.

To be fair: Userpilot's visual flow builder is genuinely useful for non-technical product managers who need to create tours without developer involvement. Tour Kit doesn't have a visual builder. If your PM team ships tours independently and you don't need deep analytics integration, Userpilot might still be the right choice.

## Concept mapping: Userpilot to Tour Kit + PostHog

| Userpilot concept | Tour Kit + PostHog equivalent | Notes |
|---|---|---|
| Flows (product tours) | `@tourkit/react` `<Tour>` + `<TourStep>` | Headless components, you control the tooltip JSX |
| Tooltips / Hotspots | `@tourkit/hints` `<Hint>` + `<HintContent>` | Beacon + popover pattern with dismissal tracking |
| Checklists | `@tourkit/checklists` `<Checklist>` | Task dependencies, progress persistence, completion callbacks |
| NPS / CSAT surveys | `@tourkit/surveys` | NPS, CSAT, CES with fatigue prevention and context awareness |
| Banners / Modals | `@tourkit/announcements` | Modal, toast, banner, slideout, and spotlight variants |
| Resource center | Custom component + Tour Kit hooks | Build with `useTour()` and your component library |
| Event tracking | PostHog `posthog.capture()` | Or `@tourkit/analytics` plugin for multi-provider |
| User segmentation | PostHog cohorts + feature flags | Feature flags control which tours show to which users |
| Session replays | PostHog session replay | Watch users interact with your tours, free tier included |
| A/B testing flows | PostHog feature flags + experiments | Split test tour variants with statistical significance |
| `userpilot.reload()` | Not needed | Tour Kit uses React context, detects route changes natively |

## Before you start

A typical Userpilot-to-Tour Kit migration takes 3-5 hours for setups with 2-3 tours and basic analytics, based on the incremental side-by-side approach described below. Larger setups with 10+ flows and custom segmentation take 1-2 days of focused engineering work.

**Prerequisites:**
- React 18.2+ or React 19
- PostHog account (free tier covers 1M events/month, 5K sessions/month)
- Your existing Userpilot flow configurations (export from Userpilot dashboard)
- Node 18+, TypeScript 5+

## Step 1: Install Tour Kit alongside Userpilot

The safest migration path installs Tour Kit and PostHog alongside your existing Userpilot script, so both systems run simultaneously and you can compare behavior before cutting over.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics posthog-js
```

Set up the providers in your app root. Userpilot's script can stay in place.

```tsx
// src/app/providers.tsx
'use client';

import { TourProvider } from '@tourkit/react';
import { PostHogProvider } from 'posthog-js/react';
import posthog from 'posthog-js';

// Initialize PostHog (skip if you already have it)
if (typeof window !== 'undefined') {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
  });
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <PostHogProvider client={posthog}>
      <TourProvider>
        {children}
      </TourProvider>
    </PostHogProvider>
  );
}
```

At this point both systems coexist. Userpilot still fires its flows; Tour Kit is wired up but dormant.

## Step 2: Map your Userpilot flow configuration

Every Userpilot flow translates to a Tour Kit tour definition with typed steps, CSS selector targets, and callback hooks. Export your flow configurations from the Userpilot dashboard and identify two things for each flow: the target elements and the step content.

```tsx
// src/tours/onboarding-tour.tsx
import { createTour, createStep } from '@tourkit/core';

export const onboardingTour = createTour({
  tourId: 'onboarding-welcome',
  steps: [
    createStep({
      id: 'welcome',
      target: '[data-tour="dashboard-header"]',
      title: 'Welcome to your dashboard',
      content: 'This is where you will find an overview of your key metrics.',
    }),
    createStep({
      id: 'create-project',
      target: '[data-tour="new-project-btn"]',
      title: 'Create your first project',
      content: 'Click here to get started with your first project.',
    }),
    createStep({
      id: 'settings',
      target: '[data-tour="settings-nav"]',
      title: 'Customize your workspace',
      content: 'Head to settings to configure your team preferences.',
    }),
  ],
});
```

Notice the `data-tour` attribute selectors. Userpilot uses CSS selectors too, but they tend to target class names or IDs that break during refactors. Using `data-tour` attributes makes your tour targets explicit and refactor-safe.

## Step 3: Replace Userpilot components with Tour Kit

Tour Kit's headless architecture means you render your own tooltip and overlay markup using your existing design system components. You write 20-30 lines of JSX but gain full control over styling and responsive behavior without CSS overrides or `!important` hacks.

```tsx
// src/components/OnboardingTour.tsx
'use client';

import { Tour, TourStep, TourOverlay } from '@tourkit/react';
import { useTour } from '@tourkit/react';
import posthog from 'posthog-js';
import { onboardingTour } from '../tours/onboarding-tour';

export function OnboardingTour() {
  const { currentStep, next, prev, stop, isActive } = useTour(
    onboardingTour.tourId
  );

  const handleStepChange = (stepIndex: number) => {
    posthog.capture('tour_step_viewed', {
      tour_id: onboardingTour.tourId,
      step_index: stepIndex,
      step_id: onboardingTour.steps[stepIndex]?.id,
    });
  };

  const handleComplete = () => {
    posthog.capture('tour_completed', {
      tour_id: onboardingTour.tourId,
      total_steps: onboardingTour.steps.length,
    });
  };

  return (
    <Tour
      tour={onboardingTour}
      onStepChange={handleStepChange}
      onComplete={handleComplete}
    >
      <TourOverlay />
      {onboardingTour.steps.map((step, index) => (
        <TourStep key={step.id} step={step}>
          <div className="rounded-lg bg-white p-4 shadow-lg">
            <h3 className="font-semibold">{step.title}</h3>
            <p className="mt-1 text-sm text-gray-600">{step.content}</p>
            <div className="mt-3 flex gap-2">
              {index > 0 && (
                <button onClick={prev} className="text-sm text-gray-500">
                  Back
                </button>
              )}
              <button
                onClick={index === onboardingTour.steps.length - 1 ? stop : next}
                className="rounded bg-blue-600 px-3 py-1 text-sm text-white"
              >
                {index === onboardingTour.steps.length - 1 ? 'Done' : 'Next'}
              </button>
            </div>
          </div>
        </TourStep>
      ))}
    </Tour>
  );
}
```

This is the biggest shift from Userpilot. You write the UI. If you're using shadcn/ui, wrap Tour Kit's step content in your existing Card and Popover components. The design system mismatch that plagues Userpilot integrations vanishes because there's no pre-built UI to fight.

## Step 4: Test side-by-side

Run both systems for a week. Compare completion rates in Userpilot's dashboard against your PostHog funnel.

Check three things:
1. Tour Kit tours trigger on the same pages as Userpilot flows
2. PostHog events fire correctly (check the Events tab in PostHog)
3. Step completion rates are comparable between both systems

The gotcha we hit: Userpilot's "completion" metric counts differently than a custom PostHog funnel. Userpilot marks completion when the last step renders; PostHog tracks the explicit `tour_completed` event you fire. If your completion rates differ by 5-10%, check whether Userpilot counts auto-dismissed tours as completions.

## Step 5: Remove Userpilot

After verifying Tour Kit tours match Userpilot's behavior and PostHog captures all the events you need, remove the Userpilot script and npm package.

```bash
npm uninstall userpilot
```

Remove the Userpilot initialization snippet and any `userpilot.reload()` calls from your router. Tour Kit doesn't need them because it uses React context to track the current step and re-renders automatically on navigation.

## What you gain (and what you lose)

| Category | What you gain | What you lose |
|---|---|---|
| Cost | $0-99 one-time (Tour Kit) + PostHog free tier vs $3,588-9,588/year (Userpilot) | Time investment for initial migration (3-5 hours typical) |
| Analytics | Single source of truth in PostHog, no duplicate dashboards | Userpilot's built-in flow-specific analytics dashboards |
| Customization | Full control over every pixel of tooltip, modal, and banner UI | Userpilot's visual flow builder for non-technical users |
| Performance | Tour Kit core < 8KB gzipped, tree-shakeable, no external scripts | Nothing. Userpilot's monolithic script is larger |
| Vendor lock-in | Open source (MIT core), data stays in your infrastructure | Userpilot's managed hosting (some teams prefer this) |

The biggest loss is real: Userpilot's visual flow builder lets product managers create and edit tours without writing code. Tour Kit requires a React developer for every change. If your PM team ships tours independently and frequently, that's a genuine workflow regression.

## FAQ

### How long does it take to migrate from Userpilot to Tour Kit?

Tour Kit migration from Userpilot typically takes 3-5 hours for a setup with 2-3 tours. Larger implementations with 10+ flows take 1-2 days. The side-by-side approach means you can migrate one flow at a time without downtime.

### Can Tour Kit do everything Userpilot does?

Tour Kit covers tours, hints, checklists, surveys, announcements, and adoption tracking across 10 packages. PostHog adds analytics and experimentation. Together they match Userpilot's feature set, minus the visual flow builder.

### How much money will I save by switching from Userpilot?

Userpilot costs $3,588-9,588/year as of April 2026. Tour Kit's core packages are MIT (free) and Pro costs $99 one-time. PostHog's free tier covers 1M events/month. First-year savings range from $3,489 to $8,401 depending on your current plan.

### Does PostHog replace Userpilot's analytics completely?

PostHog covers product analytics, session replays, A/B testing, and feature flags. It exceeds Userpilot's analytics. The gap: PostHog can't deliver in-app guidance directly. Tour Kit fills that role as the onboarding UX layer.

### Will my existing Userpilot tours break during migration?

No. The recommended approach runs both systems simultaneously. Install Tour Kit, rebuild your tours in code, verify they work, then remove the Userpilot script. Existing flows keep running until you explicitly remove them.
