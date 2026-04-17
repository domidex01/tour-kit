# Feature flag-driven tours: show the right tour to the right user

## How to connect LaunchDarkly, GrowthBook, or PostHog flags to React product tours with type safety

*Originally published at [usertourkit.com](https://usertourkit.com/blog/feature-flag-product-tour)*

Your pricing page just shipped a new comparison table, but only 30% of accounts have access. Your onboarding tour still walks every user through the old layout. The result: confused users clicking buttons that don't exist for them, and a support team fielding tickets you could have prevented.

Feature flags already gate which UI components render. Product tours should follow the same gates. Yet as of April 2026, almost zero developer content shows how to compose a FlagProvider with a TourProvider to conditionally deliver the right onboarding flow.

This guide bridges that gap. You'll learn how to wire any feature flag SDK into Tour Kit's step filtering, so each user cohort sees only the tour steps that match their enabled features.

## What is a feature flag-driven product tour?

A feature flag-driven product tour is an onboarding flow where each step's visibility depends on the user's active feature flags rather than static role checks or hardcoded conditions. The flag provider evaluates which features a specific user can access, and the tour engine skips steps for gated features automatically.

As of April 2026, 96% of companies expecting significant growth invest in feature experimentation (GrowthBook, 2025), making this pattern increasingly relevant.

## The provider composition pattern

Every major feature flag SDK for React follows the same architecture: a context provider at the app root and a hook to read flag values inside components. Tour Kit uses the same model. The flag provider wraps the tour provider so that Tour Kit's when callbacks can access the flag hook.

The pattern is identical across SDKs. Swap GrowthBookProvider for asyncWithLDProvider (LaunchDarkly), FlagsmithProvider (Flagsmith), or PostHogProvider (PostHog). The tour layer doesn't know or care which flag service you use.

## Connecting flags to tour steps

Tour Kit's `when` prop accepts a function that returns a boolean. If it returns false, the step gets skipped entirely. No DOM node mounts, no wasted render cycle. Users with different active flags see different step counts, and the step index auto-adjusts automatically.

## Type-safe tour targeting

Here's a gotcha we hit early: JavaScript treats the string "false" as truthy. If your flag SDK returns string values instead of booleans, a flag set to "false" will pass a truthiness check and show the tour step to everyone. GrowthBook documented this exact bug in their type safety guide.

The fix is to define a typed flag map and use it everywhere. TypeScript catches typos at build time. No runtime surprises.

## Handling async flag evaluation without flicker

Client-side flag SDKs fetch flag values asynchronously. Between the initial render and the flag response, your tour doesn't know which steps to show. Two approaches work:

**Wait for flags before mounting the tour.** GrowthBook and LaunchDarkly both expose a "ready" state. Delay the tour until flags resolve.

**Evaluate flags server-side.** In Next.js App Router, evaluate flags in a Server Component and pass boolean props to the client tour component. This eliminates the async wait entirely and prevents layout shift.

## A/B testing onboarding flows with flag experiments

Feature flags aren't just on/off switches. GrowthBook and PostHog support experiments where users get randomly assigned to variants, and you measure which variant performs better. Track tour completion as the experiment's conversion metric. If the "video" variant has 68% completion versus 41% for "short," you have data to justify the effort.

## Common mistakes to avoid

- Nesting flag checks inside tour step content instead of using the `when` prop
- Forgetting reduced-motion preferences on feature-flagged tours
- Evaluating flags on every render instead of calling the hook at the component level

The 2026 State of Customer Onboarding report found that 57% of leaders say onboarding friction directly impacts revenue realization (OnRamp, 2026). Testing your tours isn't optional at that stake.

Full article with code examples, SDK comparison table, and implementation patterns: [usertourkit.com/blog/feature-flag-product-tour](https://usertourkit.com/blog/feature-flag-product-tour)

---

*Import this article to Medium via medium.com/p/import to automatically set the canonical URL.*
*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
