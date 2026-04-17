Most teams measure whether users finish their onboarding tour. That's the wrong metric.

A 70% completion rate looks great in a dashboard. But it tells you nothing about whether users actually did the thing the tour was trying to teach them.

We ran an A/B test on our onboarding flow using Statsig (free tier, 2M events/month) and found something interesting:

A focused 3-step tour drove 23% faster time-to-activation than our original 5-step version. Fewer steps, but users reached the core action faster.

The catch: the shorter variant had a slightly higher bounce rate on step 1. Users who missed the orientation context felt lost. Guardrail metrics surfaced this tradeoff before we shipped.

Three takeaways for product and engineering teams:

1. Track activation, not completion. "Did they create their first project?" matters more than "did they click through all 5 steps?"

2. Set guardrail metrics before you start. Bounce rate and time-to-activation caught a problem our primary metric missed.

3. Both variants need to be accessible. If one experiment group gets proper keyboard navigation and the other doesn't, you're running a discriminatory test.

Full tutorial with React/TypeScript code: https://usertourkit.com/blog/ab-test-onboarding-statsig

#react #abtesting #productdevelopment #onboarding #webdevelopment
