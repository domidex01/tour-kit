## Subreddit: r/reactjs

**Title:** I wrote a guide on A/B testing onboarding tours with Statsig (free tier) — here's what we learned

**Body:**

I've been working on a headless product tour library and we wanted to figure out whether our default 5-step onboarding tour actually worked better than a shorter 3-step version. Instead of guessing, we set up a proper A/B test.

The stack: Statsig for experiment infrastructure (free up to 2M events/month, unlimited feature flags) and Tour Kit for the tour rendering. Combined bundle cost is under 22KB.

The key insight from running this: **tour completion rate is a vanity metric**. We had ~70% completion on the 5-step tour, which looked great. But when we tracked activation (did the user actually create their first project after the tour), the 3-step focused tour won by 23% on time-to-activation. The shorter tour skipped the "welcome" and "settings" steps and sent users straight to the core action.

One gotcha: the 3-step variant had a slightly higher bounce rate on step 1 because users missed the orientation context. Statsig's guardrail metrics caught this before we shipped. Without guardrails, we would've picked the "winner" without seeing the tradeoff.

The Statsig + React integration is surprisingly clean. Their `useExperiment` hook handles variant assignment and exposure logging automatically. You basically read a parameter from the experiment, use it to pick which steps array to pass to your tour, and log activation events with `client.logEvent`. Maybe 30 lines of integration code total.

One thing nobody talks about with onboarding A/B tests: both variants need to be accessible. If variant A has focus management and variant B doesn't, you're discriminating against keyboard/screen reader users in your experiment. Worth thinking about.

Full writeup with all the code (TypeScript, 6 steps, troubleshooting): https://usertourkit.com/blog/ab-test-onboarding-statsig

Disclosure: Tour Kit is my project. The Statsig integration pattern works with any tour library though.
