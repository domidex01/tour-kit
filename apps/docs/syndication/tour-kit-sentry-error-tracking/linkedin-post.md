Product tours break silently. The tooltip doesn't render, the highlight is in the wrong spot, or the tour never starts. Users don't report these issues — they just bounce.

I wrote about connecting product tour lifecycle events to Sentry's breadcrumb and error boundary APIs. The pattern is simple: each tour callback (start, step view, complete, skip) adds a Sentry breadcrumb. A tour-specific error boundary tags every crash with `component:product-tour` so it's filterable.

Result: tour failures show up in your Sentry dashboard with full context (which tour, which step, what happened before the crash) instead of surfacing through support tickets days later.

About 60 lines of TypeScript. Works with both free tiers (Sentry: 5K errors/month, Tour Kit: MIT-licensed callbacks).

Full tutorial: https://usertourkit.com/blog/tour-kit-sentry-error-tracking

#react #typescript #errormonitoring #sentry #webdevelopment #onboarding
