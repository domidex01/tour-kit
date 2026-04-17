## Subreddit: r/reactjs

**Title:** I wrote a guide on syncing product tours with LaunchDarkly flags — the glue code nobody talks about

**Body:**

Every LaunchDarkly tutorial shows how to toggle a button behind a feature flag. But nobody shows what happens when your onboarding tour points users at UI elements that 90% of them can't see because those features are behind a gradual rollout.

I spent a week building an integration between LaunchDarkly's React SDK and a headless tour library (Tour Kit). The core idea: a single `useFlaggedTour` hook that reads `useFlags()`, filters tour steps based on which flags are active for the current user, and includes a kill switch that disables all tours from the LaunchDarkly dashboard in seconds.

Three things I learned:

1. If you pass the SDK key instead of the Client-side ID, LaunchDarkly silently fails and `useFlags()` returns empty objects. The error message doesn't tell you it's the wrong key type. Burned an hour on that.

2. LaunchDarkly's streaming mode means flag changes propagate to the browser in 1-2 seconds. So you can literally kill a broken onboarding tour from the dashboard and it disappears for all active users without a deploy.

3. The same pattern works for A/B testing different tour flows — use a multivariate flag with string values like "tour-v1" and "tour-v2", then load different step arrays based on the flag value.

Full article with all the code (TypeScript, tested with React Testing Library): https://usertourkit.com/blog/tour-kit-launchdarkly-feature-flagged-onboarding

Disclosure: I built Tour Kit. It's headless/MIT, no visual builder. Happy to answer questions about the integration pattern — it should work with any tour library that accepts a step array.
