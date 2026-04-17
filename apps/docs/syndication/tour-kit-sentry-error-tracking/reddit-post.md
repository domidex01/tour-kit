## Subreddit: r/reactjs

**Title:** How I wire product tour lifecycle events to Sentry breadcrumbs for better error context

**Body:**

I've been working on a product tour library (Tour Kit) and one problem kept coming up: when tours break, they break silently. The tooltip doesn't appear, the highlight is in the wrong spot, or the tour just doesn't start. Users don't report these failures — they just bounce.

The fix turned out to be straightforward. Tour Kit fires typed callbacks on lifecycle events (tour start, step view, complete, skip), and Sentry's `addBreadcrumb` API accepts exactly this kind of structured data. About 60 lines of TypeScript to connect them:

- `onTourStart` → adds a breadcrumb + sets `active_tour` tag on the Sentry scope
- `onStepView` → adds a breadcrumb with tour ID, step ID, and step index
- `onTourComplete` / `onTourSkip` → adds a breadcrumb + clears the tag

Then you wrap tour components in `Sentry.ErrorBoundary` with a `beforeCapture` that sets `component: product-tour`. Now every tour error in your Sentry dashboard is filterable, and you can set up a dedicated alert rule for the tag.

The biggest gotcha: if your tour target is inside a `Suspense` boundary, the element might not exist when the tour tries to highlight it. Sentry captures the resulting error, and the `tour_id` tag tells you which tour caused it. Without it, you'd just see a generic "Cannot read properties of null" with zero context.

Full writeup with code examples: https://usertourkit.com/blog/tour-kit-sentry-error-tracking

Curious if anyone else has dealt with monitoring product tour failures. What approaches have you tried?
