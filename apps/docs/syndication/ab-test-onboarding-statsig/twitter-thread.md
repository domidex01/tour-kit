## Thread (6 tweets)

**1/** Tour completion rate is a vanity metric.

A user who clicks "next" 5 times to dismiss your onboarding tour = 100% completion, 0% activation.

Here's how to run actual experiments on your onboarding flow:

**2/** We tested two variants on a dashboard app:

- Variant A: 5-step tooltip tour (welcome, nav, create, settings, done)
- Variant B: 3-step focused tour (create, template, done)

Stack: Statsig (free tier) + Tour Kit (headless React). Under 22KB combined.

**3/** The result: the 3-step variant drove 23% faster time-to-activation.

But it had higher bounce on step 1. Users who skipped the welcome context felt disoriented.

Guardrail metrics caught this before we shipped. Without them, we'd have picked the "winner" without seeing the tradeoff.

**4/** The setup is ~30 lines of integration code:

- `useExperiment` hook reads the Statsig variant
- Pass different step arrays to the tour provider
- `logEvent` sends activation events back to Statsig

Statsig handles bucketing, exposure logging, and significance calculations.

**5/** Something nobody talks about: both A/B test variants must be WCAG compliant.

If variant A has focus management and B doesn't, you're running a discriminatory experiment.

Headless tour libraries solve this because the a11y layer doesn't change between variants.

**6/** Full tutorial with TypeScript code, troubleshooting, and guardrail setup:

https://usertourkit.com/blog/ab-test-onboarding-statsig

Statsig free tier: 2M events/month, unlimited flags.
Tour Kit: MIT, free forever.

Total cost: $0.
