---
title: "Connect feature flags to product tours in React (with type-safe targeting)"
published: false
description: "Feature flag articles and product tour articles exist in silos. Here's how to compose a FlagProvider with a TourProvider so each user cohort sees only the onboarding steps that match their enabled features."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/feature-flag-product-tour
cover_image: https://usertourkit.com/og-images/feature-flag-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/feature-flag-product-tour)*

# Feature flag-driven tours: show the right tour to the right user

Your pricing page just shipped a new comparison table, but only 30% of accounts have access. Your onboarding tour still walks every user through the old layout. The result: confused users clicking buttons that don't exist for them, and a support team fielding tickets you could have prevented.

Feature flags already gate which UI components render. Product tours should follow the same gates. Yet as of April 2026, almost zero developer content shows how to compose a `<FlagProvider>` with a `<TourProvider>` to conditionally deliver the right onboarding flow. Feature flag articles talk about release management. Product tour articles talk about tooltip placement. Nobody connects them.

This guide bridges that gap. You'll learn how to wire any feature flag SDK (LaunchDarkly, GrowthBook, Flagsmith, PostHog, or OpenFeature) into Tour Kit's step filtering, so each user cohort sees only the tour steps that match their enabled features. We tested this pattern against a B2B SaaS dashboard with 50+ interactive elements and four user tiers.

```bash
npm install @tourkit/core @tourkit/react
```

## What is a feature flag-driven product tour?

A feature flag-driven product tour is an onboarding flow where each step's visibility depends on the user's active feature flags rather than static role checks or hardcoded conditions. The flag provider evaluates which features a specific user can access, and the tour engine skips steps for gated features automatically. Unlike role-based filtering (where an "admin" sees admin steps), flag-driven tours respond to gradual rollouts, A/B experiments, and plan-tier entitlements without code changes. As of April 2026, 96% of companies expecting significant growth invest in feature experimentation ([GrowthBook, 2025](https://blog.growthbook.io/what-are-feature-flags/)), making this pattern increasingly relevant.

## Why feature flag-driven tours matter

Static `if (user.role === "admin")` checks break the moment your targeting gets more complex than three roles. Feature flags handle targeting at a layer above your application code, which means product and growth teams can change tour audiences without shipping a new build. Here are three concrete advantages:

**Gradual rollouts stay in sync.** When you release a feature to 10% of users behind a flag, the matching tour step appears only for that 10%. No duplicate tour definitions. No manual cohort management.

**A/B testing onboarding becomes possible.** PostHog and GrowthBook both support experiments backed by feature flags. You can serve two different tour variants to different user segments and measure which drives higher completion rates. The 2026 State of Customer Onboarding report found that 57% of leaders say onboarding friction directly impacts revenue realization ([OnRamp, 2026](https://onramp.us/blog/2026-state-of-onboarding-report)). Testing your tours isn't optional at that stake.

**Plan-tier changes propagate instantly.** When a user upgrades from Free to Pro, their flags update. The next time the tour evaluates, Pro-only steps appear without a page refresh (if your flag SDK supports streaming).

## The provider composition pattern

Every major feature flag SDK for React follows the same architecture: a context provider at the app root and a hook to read flag values inside components. Tour Kit uses the same provider-and-hook model. Composing them is straightforward.

```tsx
// src/app/providers.tsx
import { TourProvider } from "@tourkit/react";
import { GrowthBookProvider } from "@growthbook/growthbook-react";
import { growthbook } from "./lib/growthbook";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <GrowthBookProvider growthbook={growthbook}>
      <TourProvider>
        {children}
      </TourProvider>
    </GrowthBookProvider>
  );
}
```

The flag provider wraps the tour provider. This ordering matters: Tour Kit's `when` callbacks need access to the flag hook, which requires the flag context to exist above in the tree.

The pattern is identical across SDKs. Swap `GrowthBookProvider` for `asyncWithLDProvider` (LaunchDarkly), `FlagsmithProvider` (Flagsmith), or `PostHogProvider` (PostHog). The tour layer doesn't know or care which flag service you use.

## Connecting flags to tour steps

Tour Kit's `when` prop accepts a function that returns a boolean. If it returns `false`, the step gets skipped entirely. No DOM node mounts, no wasted render cycle. Here's where you call your flag hook:

```tsx
// src/tours/dashboard-tour.tsx
import { useTour, TourStep } from "@tourkit/react";
import { useFeatureIsOn } from "@growthbook/growthbook-react";

export function DashboardTour() {
  const newBilling = useFeatureIsOn("new-billing-page");
  const advancedAnalytics = useFeatureIsOn("advanced-analytics");

  return (
    <TourStep
      tourId="dashboard-onboarding"
      stepId="welcome"
      target="#dashboard-header"
      content="Welcome to your dashboard."
    >
      <TourStep
        stepId="billing"
        target="#billing-nav"
        content="Your new billing page is here."
        when={() => newBilling}
      />
      <TourStep
        stepId="analytics"
        target="#analytics-panel"
        content="Advanced analytics are now available."
        when={() => advancedAnalytics}
      />
      <TourStep
        stepId="settings"
        target="#settings-btn"
        content="Customize your workspace in settings."
      />
    </TourStep>
  );
}
```

Users with `new-billing-page: true` and `advanced-analytics: false` see steps 1, 2, and 4. Users with both flags off see steps 1 and 4. The step index auto-adjusts: "Step 1 of 2" or "Step 1 of 4" depending on the user's active flags. No manual index management.

## Feature flag SDK comparison for tour integration

Not every flag SDK works equally well with client-side React tours. We evaluated five providers against the criteria that matter for tour integration: React support, real-time updates, and self-hosting (for data-sensitive teams).

| Provider | React SDK | Open source | SSR support | Real-time streaming | Self-host option |
|---|---|---|---|---|---|
| LaunchDarkly | launchdarkly-react-client-sdk | No | Yes | Yes (SSE) | No |
| GrowthBook | @growthbook/growthbook-react | Yes (MIT) | Yes | Yes (SSE) | Yes |
| Flagsmith | flagsmith/react | Yes (BSD-3) | Yes | Yes | Yes |
| PostHog | posthog-js + posthog-react | Yes (MIT) | Yes | No | Yes |
| OpenFeature | @openfeature/react-sdk | Yes (Apache 2) | Provider-dependent | Provider-dependent | N/A (standard) |

For Tour Kit integration, streaming matters most. When a flag changes mid-session (user upgrades plan, experiment assigns variant), SSE-capable SDKs from LaunchDarkly, GrowthBook, and Flagsmith push the update to the client. Tour Kit re-evaluates `when` callbacks on the next render, so the tour adapts without a page reload.

GrowthBook stands out for open-source teams. It's MIT-licensed, self-hostable, supports SSE streaming, and has first-class TypeScript support that pairs well with Tour Kit's typed step definitions.

## Type-safe tour targeting

Here's a gotcha we hit early: JavaScript treats the string `"false"` as truthy. If your flag SDK returns string values instead of booleans, a flag set to `"false"` will pass a truthiness check and show the tour step to everyone. GrowthBook documented this exact bug in their type safety guide ([GrowthBook, 2026](https://blog.growthbook.io/type-safe-feature-flags-in-react/)).

The fix is to define a typed flag map and use it everywhere:

```tsx
// src/lib/flags.ts
export interface AppFlags {
  "new-billing-page": boolean;
  "advanced-analytics": boolean;
  "ai-assistant-beta": boolean;
  "team-collaboration-v2": boolean;
}

// src/tours/use-flagged-step.ts
import { useFeatureValue } from "@growthbook/growthbook-react";
import type { AppFlags } from "../lib/flags";

export function useFlaggedStep<K extends keyof AppFlags>(
  flagKey: K
): boolean {
  const value = useFeatureValue(flagKey, false as AppFlags[K]);
  return Boolean(value);
}
```

Now TypeScript catches typos at build time. `useFlaggedStep("new-biling-page")` (missing 'l') fails the compiler. No runtime surprises.

## Handling async flag evaluation without flicker

Client-side flag SDKs fetch flag values asynchronously. Between the initial render and the flag response, your tour doesn't know which steps to show. Rendering and then removing steps causes a visible flicker that confuses users.

Two approaches work:

**Approach 1: Wait for flags before mounting the tour.** GrowthBook and LaunchDarkly both expose a "ready" state. Delay the tour until flags resolve.

```tsx
// src/tours/guarded-tour.tsx
import { useGrowthBook } from "@growthbook/growthbook-react";

export function GuardedTour({ children }: { children: React.ReactNode }) {
  const gb = useGrowthBook();

  if (!gb?.ready) return null;

  return <>{children}</>;
}
```

**Approach 2: Evaluate flags server-side.** In Next.js App Router, evaluate flags in a Server Component and pass boolean props to the client tour component. This eliminates the async wait entirely and prevents layout shift.

```tsx
// src/app/dashboard/page.tsx (Server Component)
import { GrowthBook } from "@growthbook/growthbook";
import { DashboardTour } from "./dashboard-tour";

export default async function DashboardPage() {
  const gb = new GrowthBook({ apiHost: "...", clientKey: "..." });
  await gb.init({ timeout: 1000 });

  const flags = {
    newBilling: gb.isOn("new-billing-page"),
    advancedAnalytics: gb.isOn("advanced-analytics"),
  };

  return (
    <main>
      {/* dashboard content */}
      <DashboardTour flags={flags} />
    </main>
  );
}
```

Server-side evaluation is the better approach for Next.js apps. The tour mounts with correct steps on the first render. No flicker, no loading state, no CLS penalty.

## A/B testing onboarding flows with flag experiments

Feature flags aren't just on/off switches. GrowthBook and PostHog support experiments where users get randomly assigned to variants, and you measure which variant performs better. Applied to tours, this means you can test fundamentally different onboarding approaches.

```tsx
// src/tours/experiment-tour.tsx
import { useFeatureValue } from "@growthbook/growthbook-react";

type TourVariant = "short" | "detailed" | "video";

export function OnboardingTour() {
  const variant = useFeatureValue<TourVariant>(
    "onboarding-experiment",
    "short"
  );

  const tours: Record<TourVariant, StepConfig[]> = {
    short: [welcomeStep, quickStartStep],
    detailed: [welcomeStep, ...detailedSteps, summaryStep],
    video: [welcomeStep, videoWalkthroughStep, tryItStep],
  };

  return <Tour tourId="onboarding" steps={tours[variant]} />;
}
```

Track tour completion as the experiment's conversion metric. If the "video" variant has 68% completion versus 41% for "short," you have data to justify the effort of producing video walkthroughs. Without flag-backed experiments, you're guessing.

## Flag cleanup: when to remove tour-related flags

Every major feature flag vendor publishes a best practices guide, and flag cleanup appears in all of them ([Flagsmith best practices, 2026](https://www.flagsmith.com/blog/feature-flags-best-practices)). Tour flags accumulate faster than feature flags because tours are often temporary. A feature launch tour runs for two weeks, then every user has seen it.

Three cleanup signals:

1. **Completion rate hits 95%+** across the target audience. The flag has served its purpose.
2. **The feature ships to 100% of users.** The flag was gating a gradual rollout. Remove the flag and the `when` callback. The tour step becomes unconditional.
3. **The experiment concludes.** Pick the winning variant, hardcode it, and archive the flag.

Tour Kit's `when` prop makes cleanup easy. Remove the `when` callback from a step, and it shows for all users. Remove the entire `<TourStep>` component, and the tour shortens. No dead flag references to track down.

## Common mistakes to avoid

**Nesting flag checks inside tour step content.** Don't use `{showBilling && <p>Billing info</p>}` inside a step's content prop. Use the `when` prop instead. Content-level conditionals leave an empty step shell in the DOM that Tour Kit still counts in the step index.

**Forgetting reduced-motion preferences.** Feature-flagged tours are still tours. If your flag enables a tour with animations, respect `prefers-reduced-motion`. Tour Kit handles this automatically when you use its built-in transition props, but custom animations need manual checks.

**Evaluating flags on every render.** Flag hooks from LaunchDarkly and GrowthBook memoize internally, but wrapping `when={() => sdk.isOn("flag")}` with a new SDK call per render is wasteful. Call the hook at the component level and reference the result in the callback, as shown in the examples above.

## FAQ

### Can I use feature flags to A/B test product tours?

Yes. Tour Kit's `when` prop evaluates any boolean at render time, including experiment variant assignments from GrowthBook, PostHog, or LaunchDarkly. Create a multivariate flag with tour variants as values, render different step configs per variant, and track completion rates as your conversion metric.

### Which feature flag provider works best with React product tours?

GrowthBook is the strongest option for open-source React teams as of April 2026. It's MIT-licensed, self-hostable, and supports SSE streaming for real-time flag updates without page reloads. LaunchDarkly offers the richest targeting rules for enterprise teams. PostHog works well if you already use it for analytics. All three integrate with Tour Kit through the same provider-composition pattern.

### Do feature flag-driven tours affect page performance?

Feature flag SDKs add 5-15KB to your bundle depending on the provider. The flag evaluation itself is sub-millisecond since values are cached locally after the initial fetch. Tour Kit's `when` prop short-circuits before any DOM work, so a skipped step costs zero render time. The main performance consideration is the initial async flag fetch, which you can eliminate by evaluating flags server-side in Next.js.

### How do I handle feature flags that haven't loaded yet?

Wait for the flag SDK's "ready" state before mounting your tour component. GrowthBook exposes `gb.ready`, LaunchDarkly provides `ldClient.waitForInitialization()`, and Flagsmith has `flagsmith.init()`. Alternatively, evaluate flags in a Next.js Server Component and pass the results as props.

### What happens if the feature flag service goes down?

Most flag SDKs cache the last-known values locally and fall back to defaults you specify. Set sensible defaults for each flag: `false` for experimental features (so tours for unreleased features don't appear) and `true` for established features (so core onboarding keeps working). Tour Kit continues to evaluate `when` callbacks normally with whatever value the SDK returns.

---

**Get started with Tour Kit:** Install with `npm install @tourkit/core @tourkit/react`, check the [documentation](https://usertourkit.com/), or browse the source on [GitHub](https://github.com/DomiDex/tour-kit).
