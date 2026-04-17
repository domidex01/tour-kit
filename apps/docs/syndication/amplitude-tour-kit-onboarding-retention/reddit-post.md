## Subreddit: r/reactjs

**Title:** I wrote a guide on using Amplitude behavioral cohorts to measure whether your onboarding tour actually affects retention

**Body:**

Most onboarding analytics stop at "X% of users completed the tour." That number is nice but doesn't tell you if finishing the tour actually changes retention.

I put together a tutorial on wiring a headless React tour (using Tour Kit, a library I'm building) to Amplitude's track() API, then using behavioral cohorts to compare Day-7 and Day-30 retention between tour completers, skippers, and users who never saw the tour.

The key insight: you need three cohorts, not two. Comparing completers vs. skippers introduces selection bias — users who finish tours may already be more engaged. The "unseen" group is your control.

Some data points from the piece:
- Calm found 3x higher retention from users who completed one key onboarding step (Amplitude case study)
- Teams that redesign flows from drop-off data see 20-25% improvements in trial-to-paid conversion
- Amplitude's browser SDK is ~36KB gzipped, PostHog is ~52KB — both work but different tradeoffs on free tiers (Amplitude: 50K MTUs, PostHog: 1M events, Mixpanel: 20M events)

The whole integration is about 70 lines of TypeScript. Full article with code: https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention

Happy to answer questions about the approach. We also wrote similar guides for [PostHog](https://usertourkit.com/blog/track-product-tour-completion-posthog-events) and [Mixpanel](https://usertourkit.com/blog/mixpanel-product-tour-funnel) if you're using those instead.

---

## Alternate: r/analytics

**Title:** Tutorial: measuring onboarding tour impact on retention with Amplitude behavioral cohorts

**Body:**

Wrote a technical guide on instrumenting a React product tour with Amplitude events, then using behavioral cohorts to compare retention curves between three groups: users who completed the tour, users who dismissed it, and users who never saw it.

The three-cohort approach matters because comparing completers vs. skippers alone introduces selection bias. The "unseen" group serves as your control baseline.

Key findings from the research:
- Calm saw 3x higher retention from completing one onboarding step
- Data-driven flow redesigns improve trial-to-paid conversion by 20-25%
- Amplitude's 7% retention rule: products hitting 7% Day-30 retention are on a viable growth trajectory

Full tutorial with TypeScript code and Amplitude dashboard setup: https://usertourkit.com/blog/amplitude-tour-kit-onboarding-retention

Disclosure: I built Tour Kit (the tour library used in the tutorial), but the Amplitude integration pattern works with any custom tour implementation.
