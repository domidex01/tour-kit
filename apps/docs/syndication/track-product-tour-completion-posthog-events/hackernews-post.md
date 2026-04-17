## Title: Tracking product tour completion with PostHog custom events in React

## URL: https://usertourkit.com/blog/track-product-tour-completion-posthog-events

## Comment to post immediately after:

I've been working on a headless React product tour library (Tour Kit) and wanted to share how we wired it to PostHog for analytics. PostHog has its own product tours feature in private alpha, but it's no-code only — if you're building custom tours in React, you need to instrument capture() yourself.

The integration boils down to a wrapper function that maps four lifecycle callbacks (onStart, onComplete, onSkip, onStepChange) to five PostHog events with structured properties. Each event carries tour_id, step_index, timestamps, and completion percentage.

The interesting finding: raw tour completion rates are misleading. Industry median for 5-step tours is ~34%. What actually matters is whether tour completers activate at higher rates than users who skip. PostHog cohorts make this comparison straightforward — split users by a person property set on completion, then measure downstream activation.

One technical note: posthog-js ships at ~52KB gzipped for the core, with session replay and surveys lazy-loaded separately. Tour Kit's core is under 8KB. The PostHog SDK is the heavier dependency, but it replaces your entire analytics stack.
