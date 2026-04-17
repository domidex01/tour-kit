---
title: "Wire LaunchDarkly flags into your React product tours"
published: false
description: "Your feature flags gate which UI ships. Your onboarding tours should follow the same gates. Here's the glue code between useFlags() and a headless tour engine."
tags: react, javascript, typescript, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding
cover_image: https://usertourkit.com/og-images/tour-kit-launchdarkly-feature-flagged-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding)*

# Tour Kit + LaunchDarkly: feature-flagged onboarding flows

You shipped a new analytics dashboard behind a LaunchDarkly flag. It's rolling out to 10% of accounts this week. But your onboarding tour still walks every user through the old layout, pointing at elements that don't exist for 90% of them.

Feature flags gate which UI ships. Product tours should follow the same gates. The problem is that every LaunchDarkly tutorial stops at "toggle a button." Nobody shows the glue code between `useFlags()` and a tour engine that filters steps, swaps entire flows, or kills a broken tour in seconds without redeploying.

This guide builds that glue. You'll wire LaunchDarkly's React SDK into Tour Kit so each user cohort sees only the steps matching their enabled features. We tested this pattern against a B2B SaaS dashboard with four plan tiers and 12 feature flags.

```bash
npm install @tourkit/core @tourkit/react launchdarkly-react-client-sdk
```

## What you'll build

A React app where LaunchDarkly flags control three onboarding behaviors: which tour steps appear, which entire tour variant loads, and whether tours can be killed instantly from the LaunchDarkly dashboard. The end result is an onboarding system that stays in sync with your feature rollout without manual cohort management or conditional spaghetti.

By the end, you'll have a `useFlaggedTour` hook that reads LaunchDarkly flags and passes filtered steps to Tour Kit. No changes to Tour Kit internals, no forking, no monkey-patching.

## Why LaunchDarkly + Tour Kit?

LaunchDarkly is the most widely adopted feature flag platform, with its React SDK pulling roughly 998K weekly npm downloads as of April 2026. Tour Kit is a headless tour library that ships at under 8KB gzipped with zero runtime dependencies. Together they solve a problem neither handles alone: targeting onboarding flows to specific user segments without hardcoding conditions.

Three reasons this pairing works:

**Rollout rings propagate to tours automatically.** When you move a feature from 10% to 50% of users, the matching tour steps appear for that 50%. No tour configuration changes needed.

**Kill switches work on tours too.** LaunchDarkly's "kill switch" pattern (turning a flag OFF instantly) disables a broken tour in seconds. Your new onboarding confused users? Kill it from the dashboard while you fix the copy. No deploy, no hotfix.

**Plan-tier targeting comes free.** LaunchDarkly evaluates user attributes like `plan`, `role`, and `company_size` server-side, then streams results to the client SDK. Tour Kit reads those flag values and filters steps.

One limitation to flag: Tour Kit requires React developers to write code. There's no visual builder where a product manager can drag tour steps onto a screen and assign flags. The integration described here is code-first, which means your engineering team owns the tour definitions.

The other tradeoff: LaunchDarkly's React SDK adds roughly 150KB to your bundle. If you're already using LaunchDarkly for feature management, that cost is sunk. If you're evaluating flag providers specifically for tour targeting, lighter alternatives like GrowthBook (~10KB) or Flagsmith (~12KB) exist.

## Prerequisites

- A LaunchDarkly account (the free Developer plan includes 2 seats)
- Your **Client-side ID** from LaunchDarkly's project settings (not the SDK key or Mobile key)
- A React 18+ project with TypeScript
- Tour Kit installed: `npm install @tourkit/core @tourkit/react`

Create two boolean flags in your LaunchDarkly dashboard:

1. `release-onboarding-analytics-dashboard` — gates the analytics feature tour
2. `kill-onboarding-tours` — emergency kill switch for all tours

For both flags, enable "Make this flag available to client-side SDKs" in the flag settings. The React SDK can only evaluate client-side flags.

## Step 1: set up the LaunchDarkly provider

Wrap your app with both providers. `LDProvider` goes outside `TourProvider` so flag values resolve before tours initialize.

```tsx
// src/app/providers.tsx
import { LDProvider } from 'launchdarkly-react-client-sdk';
import { TourProvider } from '@tourkit/react';

const LD_CLIENT_ID = process.env.NEXT_PUBLIC_LD_CLIENT_SIDE_ID!;

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <LDProvider
      clientSideID={LD_CLIENT_ID}
      context={{
        kind: 'user',
        key: 'user-123',
        name: 'Jane Doe',
        plan: 'pro',
        role: 'admin',
      }}
    >
      <TourProvider>
        {children}
      </TourProvider>
    </LDProvider>
  );
}
```

The `context` object is where targeting happens. LaunchDarkly evaluates your flag rules against these attributes. When a user upgrades from `free` to `pro`, update the context and the SDK re-evaluates all flags via streaming. No page refresh needed.

**Gotcha we hit:** if you pass the SDK key instead of the Client-side ID, the SDK silently fails and `useFlags()` returns empty objects. The error message doesn't mention the wrong key type. Double-check you're using the Client-side ID from Project Settings > Environments.

## Step 2: build the flag-filtered tour hook

The connection between LaunchDarkly and Tour Kit is a single custom hook called `useFlaggedTour`.

```tsx
// src/hooks/use-flagged-tour.ts
import { useFlags } from 'launchdarkly-react-client-sdk';
import { useMemo } from 'react';
import type { TourStep } from '@tourkit/core';

interface FlaggedStep extends TourStep {
  featureFlag?: string;
}

export function useFlaggedTour(steps: FlaggedStep[]) {
  const flags = useFlags();

  const filteredSteps = useMemo(() => {
    if (flags['kill-onboarding-tours']) {
      return [];
    }

    return steps.filter((step) => {
      if (!step.featureFlag) return true;
      return Boolean(flags[step.featureFlag]);
    });
  }, [steps, flags]);

  return { steps: filteredSteps, flags };
}
```

Each tour step can optionally declare a `featureFlag` property. If the flag evaluates to `true` for the current user, the step appears. If not, it's filtered out before Tour Kit sees it. Steps without a `featureFlag` always show.

The kill switch (`kill-onboarding-tours`) returns an empty array, which makes Tour Kit render nothing.

## Step 3: define flag-gated tour steps

```tsx
// src/tours/dashboard-tour.tsx
import { Tour, TourStep, TourTooltip } from '@tourkit/react';
import { useFlaggedTour } from '../hooks/use-flagged-tour';

const DASHBOARD_STEPS = [
  {
    id: 'welcome',
    target: '#dashboard-header',
    title: 'Welcome to your dashboard',
    content: 'Here is a quick overview of what you can do.',
  },
  {
    id: 'analytics-panel',
    target: '#analytics-widget',
    title: 'Your new analytics panel',
    content: 'Track engagement metrics in real time.',
    featureFlag: 'release-onboarding-analytics-dashboard',
  },
  {
    id: 'export-csv',
    target: '#export-button',
    title: 'Export your data',
    content: 'Download reports as CSV or PDF.',
    featureFlag: 'release-export-feature',
  },
];

export function DashboardTour() {
  const { steps } = useFlaggedTour(DASHBOARD_STEPS);

  if (steps.length === 0) return null;

  return (
    <Tour tourId="dashboard-onboarding" steps={steps}>
      <TourStep>
        <TourTooltip />
      </TourStep>
    </Tour>
  );
}
```

A user on the 10% rollout ring for `release-onboarding-analytics-dashboard` sees three steps. Everyone else sees two. When the flag rolls out to 100%, the third step appears automatically.

## Step 4: verify it works

1. **Open your app** with the LaunchDarkly debugger enabled (add `?ldclient_debug=true` to the URL)
2. **Turn OFF** `release-onboarding-analytics-dashboard` in the dashboard
3. **Verify** the analytics panel step disappears from the tour within 1-2 seconds
4. **Turn ON** `kill-onboarding-tours`
5. **Verify** the entire tour vanishes immediately

For automated testing, mock LaunchDarkly's provider:

```tsx
// src/tests/dashboard-tour.test.tsx
import { render, screen } from '@testing-library/react';
import { LDProvider } from 'launchdarkly-react-client-sdk';
import { DashboardTour } from '../tours/dashboard-tour';

const mockFlags = {
  'release-onboarding-analytics-dashboard': true,
  'kill-onboarding-tours': false,
};

test('shows analytics step when flag is on', () => {
  render(
    <LDProvider clientSideID="test" flags={mockFlags}>
      <DashboardTour />
    </LDProvider>
  );
  expect(screen.getByText('Your new analytics panel')).toBeDefined();
});
```

## Going further

**Progressive rollout rings for tours.** LaunchDarkly supports percentage rollouts. Use them to canary-test a new onboarding flow: 1% internal, then 5% canary, then 25% beta, then 100% GA.

**A/B testing tour variants.** Create a multivariate flag with string values like `"tour-v1"` and `"tour-v2"`. In your hook, load different step arrays based on the flag value instead of filtering a single array.

**Analytics correlation.** Tour Kit's `@tourkit/analytics` package fires events on step completion, tour finish, and tour skip. Send these events to your data warehouse alongside LaunchDarkly's flag evaluation data.

Full article with comparison table and FAQ: [usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding)

---

*We built Tour Kit, so take our integration guidance with appropriate skepticism. Tour Kit doesn't have a visual builder or drag-and-drop editor. If you need no-code tour creation, LaunchDarkly pairs better with tools like Appcues or Pendo.*
