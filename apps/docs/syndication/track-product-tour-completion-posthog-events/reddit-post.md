## Subreddit: r/reactjs

**Title:** I wrote a guide on wiring PostHog events to headless product tour callbacks — funnels, drop-off analysis, activation cohorts

**Body:**

I've been building a headless product tour library for React and needed to figure out the best way to track tour completion with PostHog. PostHog's own product tours feature is still in private alpha and only works with their no-code builder, so if you're running a custom React tour you need to wire `capture()` yourself.

The key pattern: a `withPostHogTracking()` wrapper that maps four tour lifecycle callbacks (onStart, onComplete, onSkip, onStepChange) to five PostHog events. About 60 lines of TypeScript. Each event includes properties like `tour_id`, `step_index`, `time_on_step_ms`, and `completion_pct`.

Some numbers that might be useful: median 5-step tour completion is roughly 34% (Product Fruits benchmarks). Launcher-driven tours where users opt in hit ~67%. But raw completion is a vanity metric — the real question is whether tour completers activate at higher rates than skippers, which PostHog cohorts can answer.

The part I found most useful: setting person properties (`tour_completed_{tourId}: true`) on completion so you can build cohorts and compare activation rates. That's where you find out if the tour is actually doing its job.

Full tutorial with all the code, funnel setup, and troubleshooting: https://usertourkit.com/blog/track-product-tour-completion-posthog-events

Happy to answer questions about the approach or PostHog integration patterns.
