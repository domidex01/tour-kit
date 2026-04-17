---
title: "Tour Kit + LaunchDarkly: feature-flagged onboarding flows"
slug: "tour-kit-launchdarkly-feature-flagged-onboarding"
canonical: https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding)*

# Tour Kit + LaunchDarkly: feature-flagged onboarding flows

You shipped a new analytics dashboard behind a LaunchDarkly flag. It's rolling out to 10% of accounts this week. But your onboarding tour still walks every user through the old layout, pointing at elements that don't exist for 90% of them.

Feature flags gate which UI ships. Product tours should follow the same gates. The problem is that every LaunchDarkly tutorial stops at "toggle a button." Nobody shows the glue code between `useFlags()` and a tour engine that filters steps, swaps entire flows, or kills a broken tour in seconds without redeploying.

This guide builds that glue. You'll wire LaunchDarkly's React SDK into Tour Kit so each user cohort sees only the steps matching their enabled features.

```bash
npm install @tourkit/core @tourkit/react launchdarkly-react-client-sdk
```

## What you'll build

A React app where LaunchDarkly flags control three onboarding behaviors: which tour steps appear, which entire tour variant loads, and whether tours can be killed instantly from the LaunchDarkly dashboard.

By the end, you'll have a `useFlaggedTour` hook that reads LaunchDarkly flags and passes filtered steps to Tour Kit. No changes to Tour Kit internals, no forking, no monkey-patching.

## Why LaunchDarkly + Tour Kit?

LaunchDarkly is the most widely adopted feature flag platform, with its React SDK pulling roughly 998K weekly npm downloads as of April 2026. Tour Kit is a headless tour library that ships at under 8KB gzipped with zero runtime dependencies. Together they solve a problem neither handles alone: targeting onboarding flows to specific user segments without hardcoding conditions.

**Rollout rings propagate to tours automatically.** When you move a feature from 10% to 50% of users, the matching tour steps appear for that 50%.

**Kill switches work on tours too.** LaunchDarkly's "kill switch" pattern disables a broken tour in seconds. No deploy, no hotfix.

**Plan-tier targeting comes free.** LaunchDarkly evaluates user attributes like `plan`, `role`, and `company_size` server-side, then streams results to the client SDK.

One limitation: Tour Kit requires React developers to write code. There's no visual builder. This integration is code-first.

## The glue code: useFlaggedTour hook

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

Each tour step can optionally declare a `featureFlag` property. If the flag evaluates to `true` for the current user, the step appears. Steps without a `featureFlag` always show. The kill switch returns an empty array, making Tour Kit render nothing.

## Full walkthrough

The complete article includes provider setup, flag-gated step definitions, testing patterns, a comparison table of flag providers, and FAQ:

[Read the full guide at usertourkit.com](https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding)

---

*We built Tour Kit, so take our integration guidance with appropriate skepticism. Tour Kit doesn't have a visual builder. If you need no-code tour creation, LaunchDarkly pairs better with tools like Appcues or Pendo.*
