## Thread (6 tweets)

**1/** Product tours break silently. The tooltip doesn't appear, the highlight is in the wrong spot, the tour never starts. Users don't report these — they just leave. Here's how I wire tour lifecycle events to Sentry for proactive error monitoring:

**2/** Tour Kit fires typed callbacks on every lifecycle event: start, step view, complete, skip. Each one maps to a `Sentry.addBreadcrumb()` call with the tour ID, step ID, and step index. Now every error report shows exactly which tour and step was active when things broke.

**3/** The key trick: `Sentry.setTag('component', 'product-tour')` in a tour-specific error boundary. This lets you filter Sentry to show ONLY tour errors and set up a dedicated alert rule. Tour failures ping Slack before users notice.

**4/** Biggest gotcha: tour targets inside React Suspense boundaries. The element doesn't exist when the tour tries to highlight it → null reference error. Without the tour breadcrumb context, this looks like a random crash with zero debugging trail.

**5/** The whole integration is ~60 lines of TypeScript across 2 files. Works with Sentry's free tier (5K errors/month) and Tour Kit's MIT-licensed callbacks. No paid features required on either side.

**6/** Full tutorial with all the code: https://usertourkit.com/blog/tour-kit-sentry-error-tracking
