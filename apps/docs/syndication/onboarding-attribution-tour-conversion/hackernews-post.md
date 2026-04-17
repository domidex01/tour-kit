## Title: Tour-level attribution: applying multi-touch models to in-app onboarding flows

## URL: https://usertourkit.com/blog/onboarding-attribution-tour-conversion

## Comment to post immediately after:

I've been working on Tour Kit (a headless React product tour library) and kept running into the same question from users: "which tour is actually working?"

Marketing attribution has mature tooling (Mixpanel, Amplitude, PostHog all handle channel-level attribution). But nobody applies these models inside the product. When you have five onboarding tours and a user converts on day 9, which tour gets credit?

The article covers how to instrument tour-level attribution using custom events, including a TypeScript implementation of first-touch, last-touch, linear, and U-shaped models. The most interesting finding was around holdout groups: when we set aside 15% of users who never saw tours and compared conversion rates, two of five tours showed near-zero impact. Those tours were generating great completion metrics but not moving the conversion needle.

Data point that surprised me: 95% of SaaS companies misattribute revenue with single-touch models (House of Martech), and that's just the marketing side. Inside the product, most teams track zero attribution data for in-app guidance.
