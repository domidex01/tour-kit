---
title: "Secondary onboarding in React: drive feature adoption after activation"
published: false
description: "75% of SaaS features go undiscovered. Here's how to build behavioral-triggered onboarding flows in React that surface advanced features to activated users."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/secondary-onboarding-feature-adoption
cover_image: https://usertourkit.com/og-images/secondary-onboarding-feature-adoption.png
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

The three-stage model breaks it down clearly:

1. **Primary**: new user activation, first value moment
2. **Secondary**: advanced feature discovery, power-user conversion
3. **Tertiary**: retention, loyalty, account expansion

Most onboarding content lumps all three together. That's a mistake. Each stage requires different triggers, different UI patterns, and different measurement.

## Why secondary onboarding matters for React teams

The average SaaS product has a core feature adoption rate of just 24.5%, with a median of 16.5% ([Artisan Growth Strategies, 2025](https://www.artisangrowthstrategies.com/blog/feature-adoption-metrics-top-benchmarks-2025)). That means roughly three out of four features you ship never get meaningful traction. Not because they're bad features, but because users never find them.

Vitaly Friedman put it well in Smashing Magazine's TARS analysis: "Sometimes, low feature adoption has nothing to do with the feature itself, but rather where it sits in the UI — users might never discover it if it's hidden or if it has a confusing label" ([Smashing Magazine, Dec 2025](https://www.smashingmagazine.com/2025/12/how-measure-impact-features-tars/)).

And the business impact is measurable. Users who adopt features regularly are 31% less likely to churn. Interactive walkthroughs drive 31% adoption versus 16.5% for documentation alone. Yet as of 2026, 36% of SaaS companies still have zero intentional in-app guidance ([UserGuiding, State of PLG 2026](https://userguiding.com/blog/state-of-plg-in-saas)).

The gap isn't awareness. Product teams know features are underused. The gap is implementation: actually building the contextual nudges that surface the right feature at the right moment.

## Behavioral triggers: the core pattern

Secondary onboarding only works when it fires at the right time. Showing a reporting dashboard tour to someone who hasn't created their first project is noise. Showing it the moment they've created three projects and haven't opened reports once? That's contextual.

Here's the pattern with Tour Kit's adoption tracking:

```tsx
// src/components/SecondaryOnboarding.tsx
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
      <TourStep
        target="[data-tour='export-btn']"
        title="Export to CSV or PDF"
        content="Pull data into your existing workflows with one click."
      />
    </TourProvider>
  );
}
```

The key decisions in this pattern:

- **Gate on behavior, not time.** `hasCompleted('create-project', { minCount: 3 })` fires only after meaningful usage. Calendar-based triggers ("show after 7 days") miss the point.
- **Track completion separately.** `!hasCompleted('viewed-reports-tour')` prevents the tour from firing repeatedly. Tour Kit persists this to `localStorage` by default, or your own storage adapter.
- **Keep it short.** Two steps, not ten. Secondary tours should feel like helpful hints, not mandatory training.

## Progressive feature disclosure in React

Progressive disclosure means revealing complexity only when users are ready for it. In a dashboard, this might mean showing basic charts first and surfacing the custom query builder after someone has viewed reports five times.

Most articles describe this as a UX principle. For React developers, it's a component composition problem.

```tsx
// src/components/AdvancedFeatureGate.tsx
import { useAdoptionTracking } from '@tourkit/adoption';
import { AdoptionNudge } from '@tourkit/adoption';

interface FeatureGateProps {
  featureId: string;
  prerequisite: string;
  minUses: number;
  children: React.ReactNode;
  nudgeContent: string;
}

function AdvancedFeatureGate({
  featureId,
  prerequisite,
  minUses,
  children,
  nudgeContent,
}: FeatureGateProps) {
  const { hasCompleted, getUsageCount } = useAdoptionTracking();
  const usageCount = getUsageCount(prerequisite);
  const isReady = usageCount >= minUses;
  const hasSeenNudge = hasCompleted(`${featureId}-nudge`);

  if (!isReady) return null;

  return (
    <>
      {children}
      {!hasSeenNudge && (
        <AdoptionNudge
          featureId={featureId}
          target={`[data-feature='${featureId}']`}
          content={nudgeContent}
        />
      )}
    </>
  );
}
```

This pattern composes with any design system. The `AdoptionNudge` renders as a tooltip positioned near the target element. Because Tour Kit is headless, you control the markup entirely. Wrap it in your own `Popover`, style it with Tailwind, or slot it into a Radix primitive using `asChild`.

## Contextual hints over full tours

Full step-by-step tours make sense for primary onboarding. For secondary onboarding, they're too heavy. A user who's been in your product for two months doesn't want a guided walkthrough. They want a quick nudge.

Tour Kit's hints package handles this:

```tsx
// src/components/FeatureHints.tsx
import { HintProvider, Hint } from '@tourkit/hints';

function DashboardHints() {
  return (
    <HintProvider dismissBehavior="per-user">
      <Hint
        target="[data-hint='bulk-import']"
        content="Import up to 10,000 records from CSV"
        showAfter={{ event: 'manual-entry', count: 5 }}
      />
      <Hint
        target="[data-hint='keyboard-shortcuts']"
        content="Press ? to see all keyboard shortcuts"
        showAfter={{ event: 'page-visit', count: 10 }}
      />
    </HintProvider>
  );
}
```

Hints are less intrusive. They show a small beacon on the target element and expand on hover or click. Dismissed hints stay dismissed. Tour Kit tracks this per user, not per session.

## Measuring secondary onboarding with TARS

You need a framework for deciding which features need secondary onboarding and whether your efforts are working. The TARS metric (Task, Adoption, Retention, Satisfaction) from [Smashing Magazine's research](https://www.smashingmagazine.com/2025/12/how-measure-impact-features-tars/) provides clear thresholds:

| Adoption level | Threshold | What it means |
|---|---|---|
| High | >60% | Feature is well-placed, users find it naturally |
| Medium | 25-35% retention | Secondary onboarding can push this higher |
| Low | <20% | Feature is hidden, mislabeled, or solving a niche problem |

Features in the medium band are your best targets for secondary onboarding. They solve a real problem, but users need a push to discover them. Low-adoption features might need redesign, not onboarding.

## User segmentation without a CDP

Not every user needs the same secondary onboarding. Power users who've already discovered advanced features shouldn't see nudges for them. Struggling users who haven't completed basic tasks aren't ready for advanced ones.

You don't need a customer data platform for this. Tour Kit's adoption tracking gives you enough signal:

```tsx
// src/hooks/useUserSegment.ts
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

Then gate your secondary tours on segment:

```tsx
const segment = useUserSegment();

{segment === 'engaged' && <ReportsTourTrigger />}
{segment === 'activated' && <CoreFeatureHints />}
```

This keeps the logic in your React tree where it belongs. Testable, composable, visible in your component hierarchy. No black-box segmentation rules hidden behind a vendor dashboard.

## Common mistakes that kill secondary onboarding

**Treating it as a one-time event.** Secondary onboarding is ongoing. New features ship monthly. User behavior changes. Build your implementation to support adding new tours and hints without touching existing ones.

**Ignoring accessibility.** Every tooltip, modal, and hint needs proper ARIA roles. Tour Kit handles `role="dialog"`, `aria-describedby`, focus trapping, and `Escape` to dismiss out of the box. If you're building custom UI on top of the headless hooks, test with a screen reader.

**Firing too many nudges at once.** Two visible hints is the maximum before cognitive load tanks the experience. Tour Kit's `HintProvider` queues hints automatically, showing one at a time.

**Measuring only completion rates.** A 90% completion rate on a two-step tour doesn't mean much. Measure downstream adoption: did users who saw the reports tour actually use the reports dashboard in the following week?

## Tools and libraries for secondary onboarding

| Tool | Approach | Best for | Trade-off |
|---|---|---|---|
| Tour Kit | Headless React library, code-first | Teams who want full control and own their onboarding code | Requires React developers; no visual builder |
| Userpilot | No-code SaaS platform | Product teams without frontend engineering bandwidth | MAU-based pricing scales quickly; vendor dependency |
| Appcues | No-code with Chrome extension builder | Quick launches where speed matters more than customization | $249/mo starting; limited design flexibility |
| Chameleon | No-code with developer API | Hybrid teams that want both visual builder and API access | Smaller community; complex pricing tiers |

Full disclosure: we built Tour Kit, so take the comparison with appropriate skepticism. Every claim here is verifiable against the respective product pages and npm. Tour Kit is React 18+ only, has a smaller community than established SaaS tools, and requires developers to implement (there's no visual builder). For teams where a product manager needs to iterate on flows without engineering support, Userpilot or Appcues may genuinely be the better choice.

## Get started with secondary onboarding

The implementation pattern is straightforward: track user behavior with `@tourkit/adoption`, gate tours on behavioral conditions, and use hints for lightweight nudges. Start with your lowest-hanging fruit. Find the feature sitting at 15% adoption that your analytics says users would benefit from.

```bash
npm install @tourkit/core @tourkit/react @tourkit/adoption @tourkit/hints
```

[Browse the full docs and examples at usertourkit.com](https://usertourkit.com/)

## FAQ

### What's the difference between primary and secondary onboarding?

Primary onboarding targets new users reaching their first success moment: account setup, first action, initial value. Secondary onboarding feature adoption begins after activation, guiding existing users toward advanced capabilities they haven't discovered. Tour Kit's `@tour-kit/adoption` package tracks feature usage and triggers contextual nudges at the right moment.

### When should secondary onboarding tours fire?

Gate secondary onboarding on behavioral signals, not calendar time. Fire a reporting tour after a user creates their third project, not seven days after signup. Tour Kit's `hasCompleted()` and `getUsageCount()` hooks make this conditional logic explicit in your React components, targeting users most likely to benefit.

### Can you implement secondary onboarding without a SaaS tool?

Yes. Tour Kit ships secondary onboarding across four packages totaling under 30KB gzipped: core, react, adoption, and hints. You need React developers to implement and maintain flows. The upside is code-owned logic, no per-MAU costs, and full design system integration.
