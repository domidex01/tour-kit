## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up how to sync product tours with LaunchDarkly feature flags in React. The core idea: a `useFlaggedTour` hook that reads `useFlags()` and filters tour steps based on which flags are active for the current user. Also includes a kill switch pattern to disable broken tours from the LD dashboard in seconds. Full code + testing patterns: https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding

Built with Tour Kit (headless, MIT). Curious if anyone else has dealt with the "onboarding tour points at UI that's behind a flag" problem.
