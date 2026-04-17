## Thread (6 tweets)

**1/** Your feature flags gate which UI ships. But your onboarding tour still walks users through UI they can't see.

Here's how to sync product tours with LaunchDarkly flags in React — a pattern nobody talks about.

**2/** The problem: you roll out a feature to 10% of users behind a flag. Your onboarding tour still shows all steps to everyone. 90% of users get pointed at elements that don't exist for them.

**3/** The fix: a single useFlaggedTour() hook (~30 lines of TypeScript) that bridges LaunchDarkly's useFlags() with your tour step array. Each step declares which flag gates it. The hook filters before the tour renders.

Bonus: a kill switch flag disables ALL tours in seconds from the LD dashboard. No deploy needed.

**4/** Three advanced patterns once the basics work:

- Progressive rollout rings for tours (canary 5% → beta 25% → GA)
- A/B test different tour flows via multivariate flags
- Correlate tour completion with flag data for retention analysis

**5/** Gotcha that cost me an hour: if you pass the SDK key instead of the Client-side ID, LaunchDarkly silently fails. useFlags() returns empty objects. The error message doesn't mention the wrong key type.

**6/** Full guide with TypeScript code, testing patterns, and a flag provider comparison table:

https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding

(Built with Tour Kit — headless, MIT, <8KB gzipped. No visual builder, requires React devs.)
