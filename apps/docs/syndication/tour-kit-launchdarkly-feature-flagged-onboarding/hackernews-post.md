## Title: Feature-flagged onboarding: syncing product tours with LaunchDarkly flags

## URL: https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding

## Comment to post immediately after:

I've been working on Tour Kit, a headless product tour library for React (~8KB gzipped). One pattern I kept running into: teams use LaunchDarkly for feature rollouts but their onboarding tours aren't aware of the flags. Users on the 10% rollout ring get walked through UI that doesn't exist for them.

The integration is a single React hook (~30 lines) that bridges useFlags() from LaunchDarkly's SDK with Tour Kit's step array. Each step can declare a featureFlag property. The hook filters steps based on active flags, and includes a kill switch that disables all tours from the LaunchDarkly dashboard without a deploy.

Interesting finding: LaunchDarkly's streaming mode means flag changes propagate in 1-2 seconds. You can disable a broken tour in production faster than you can merge a hotfix.

The article includes the full TypeScript code, testing patterns with mocked flags, and a comparison table of flag provider SDK bundle sizes (LaunchDarkly at ~150KB vs GrowthBook at ~10KB).

Honest limitation: Tour Kit is code-first with no visual builder. If you need product managers to create tours without developer involvement, this integration pattern isn't for you.
