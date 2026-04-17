---
title: "Secondary onboarding: how to drive feature adoption after activation"
slug: "secondary-onboarding-feature-adoption"
canonical: https://usertourkit.com/blog/secondary-onboarding-feature-adoption
tags: react, javascript, web-development, saas, onboarding
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/secondary-onboarding-feature-adoption)*

# Secondary onboarding: how to drive feature adoption after activation

Your users signed up. They completed the first tour, clicked around, and hit their first "aha" moment. Now what?

Most teams stop there. The initial onboarding flow shipped. Support tickets drop for a week. Everyone moves on.

But three months later, only 16.5% of users have touched the reporting dashboard. Nobody knows the keyboard shortcuts exist. The bulk import feature (the one that took two sprints) sits at 4% adoption.

This is the secondary onboarding gap. For React teams, it's a code problem, not a product-manager-clicks-buttons problem.

```bash
npm install @tourkit/core @tourkit/react @tourkit/adoption @tourkit/hints
```

## What is secondary onboarding?

Secondary onboarding is the phase that begins after a user has activated and experienced a product's core value. It focuses on surfacing advanced, niche, or newly shipped features to convert casual users into power users. Unlike primary onboarding (which guides new signups to their first success), secondary onboarding targets existing users who already understand the basics but haven't discovered the rest of your product.

The three-stage model:

1. **Primary**: new user activation, first value moment
2. **Secondary**: advanced feature discovery, power-user conversion
3. **Tertiary**: retention, loyalty, account expansion

## Why it matters

The average SaaS product has a core feature adoption rate of just 24.5%, with a median of 16.5% ([Artisan Growth Strategies, 2025](https://www.artisangrowthstrategies.com/blog/feature-adoption-metrics-top-benchmarks-2025)). Users who adopt features regularly are 31% less likely to churn. Yet 36% of SaaS companies still have zero intentional in-app guidance ([UserGuiding, State of PLG 2026](https://userguiding.com/blog/state-of-plg-in-saas)).

## Behavioral triggers: the core pattern

Secondary onboarding only works when it fires at the right time. Here's the pattern with Tour Kit's adoption tracking:

```tsx
import { useAdoptionTracking } from '@tourkit/adoption';
import { TourProvider, TourStep } from '@tourkit/react';

function ReportsTourTrigger() {
  const { hasCompleted, trackFeature } = useAdoptionTracking();

  const shouldShowReportsTour =
    hasCompleted('create-project', { minCount: 3 }) &&
    !hasCompleted('viewed-reports-tour');

  if (!shouldShowReportsTour) return null;

  return (
    <TourProvider
      tourId="reports-secondary"
      onComplete={() => trackFeature('viewed-reports-tour')}
    >
      <TourStep
        target="[data-tour='reports-nav']"
        title="Your project data is ready"
        content="You've created 3 projects. The reports dashboard shows trends across all of them."
      />
    </TourProvider>
  );
}
```

Key decisions: gate on behavior (not time), track completion separately, and keep it short (two steps, not ten).

## User segmentation without a CDP

```tsx
import { useAdoptionTracking } from '@tourkit/adoption';

type UserSegment = 'new' | 'activated' | 'engaged' | 'power';

function useUserSegment(): UserSegment {
  const { getUsageCount, hasCompleted } = useAdoptionTracking();
  const coreActions = getUsageCount('core-action');
  const advancedActions = getUsageCount('advanced-action');

  if (coreActions < 3) return 'new';
  if (!hasCompleted('primary-onboarding')) return 'activated';
  if (advancedActions < 5) return 'engaged';
  return 'power';
}
```

Then gate your secondary tours on segment. This keeps the logic in your React tree where it belongs. Testable, composable, visible in your component hierarchy.

## Common mistakes

- **Treating it as a one-time event.** New features ship monthly. Build for ongoing additions.
- **Ignoring accessibility.** Every tooltip needs proper ARIA roles, focus trapping, and `Escape` to dismiss.
- **Firing too many nudges at once.** Two visible hints is the max before cognitive overload.
- **Measuring only completion rates.** Track downstream feature adoption, not just tour completion.

Full article with all code examples, TARS measurement framework, and progressive disclosure patterns: [usertourkit.com/blog/secondary-onboarding-feature-adoption](https://usertourkit.com/blog/secondary-onboarding-feature-adoption)
