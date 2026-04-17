## Title: A/B testing onboarding flows with Statsig and a headless React tour library

## URL: https://usertourkit.com/blog/ab-test-onboarding-statsig

## Comment to post immediately after:

I wrote this after running onboarding experiments on a dashboard app. The thing that surprised me most: tour completion rate is almost useless as a metric. Our 5-step tour had ~70% completion, but the 3-step variant drove 23% faster time-to-activation (users actually doing the thing the tour teaches).

The setup is Statsig (free tier, 2M events/month) for experiment infrastructure and Tour Kit (a headless React tour library I'm building) for the tour rendering. Combined bundle is under 22KB.

The technical integration is straightforward. Statsig's `useExperiment` hook returns the variant, you pass a different steps array to the tour provider, and log activation events back into Statsig. About 30 lines of glue code.

The part I think is underexplored: accessibility in A/B-tested onboarding. If your experiment variants have different WCAG compliance levels, you're essentially running a discriminatory experiment. Statsig published a perspective on this, but I haven't seen anyone address it in practice with actual code.

Limitations worth noting: Tour Kit requires React 18+ and doesn't have a visual builder, so this approach requires developers. If your team needs a no-code solution, this isn't the right fit.

Happy to answer questions about the experiment methodology or the Statsig integration.
