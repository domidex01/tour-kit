## Subreddit: r/reactjs

**Title:** I wrote up how we instrument onboarding funnels in React (step-level tracking, not just completion rate)

**Body:**

Been working on onboarding analytics and realized most guides tell you to "track events" without showing the actual React wiring. So I wrote a guide covering how we do it.

The short version: completion rate is a vanity metric. A user who clicks through every tooltip has 100% completion but might never activate. The metric that predicts retention is whether they did the activation action *after* the tour, not whether they watched it.

Some benchmarks that surprised me while researching: activation rates vary wildly by industry. AI/ML tools average 54.8%, B2B SaaS sits at 37.5%, and FinTech is down at 5%. Using a generic "aim for 40%" target without industry context leads to wrong priorities.

One angle I haven't seen covered anywhere: analytics tools can't detect screen reader usage (intentionally, for privacy). This means your funnel data has a structural blind spot for users on assistive technology. If your onboarding breaks for keyboard-only users, they drop off silently and your metrics never show it.

The article has React code examples showing how to wire `onStepChange` and `onDismiss` callbacks to PostHog, plus a leading vs. lagging metrics taxonomy for figuring out what to measure first.

Full article with code: https://usertourkit.com/blog/funnel-analysis-onboarding-flows

Would be curious what metrics other teams track for onboarding. Anyone doing cohort-based funnel analysis (segmenting by signup source or user role)?
