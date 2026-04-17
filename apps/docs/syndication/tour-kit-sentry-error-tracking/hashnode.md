---
title: "Tour Kit + Sentry: catch tour errors before users report them"
slug: "tour-kit-sentry-error-tracking"
canonical: https://usertourkit.com/blog/tour-kit-sentry-error-tracking
tags: react, javascript, web-development, error-handling
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-sentry-error-tracking)*

# Tour Kit + Sentry: catch tour errors before users report them

Product tours interact with the DOM in brittle ways. They query selectors, calculate positions relative to moving targets, and overlay UI on top of content that might not exist yet. When a tour breaks, the failure is usually silent: the tooltip doesn't appear, the highlight renders in the wrong spot, or the whole tour quietly fails to start. Users don't file bug reports for "the onboarding thing didn't show up." They just leave.

Sentry captures these failures with enough context to reproduce them. As of April 2026, `@sentry/react` ships at roughly 30KB gzipped and pulls about 2.1M weekly npm downloads.

This tutorial wires Tour Kit's lifecycle callbacks to Sentry breadcrumbs, wraps tours in an error boundary with tour-specific context, and sets up alert rules so tour failures ping your team before users notice.

The full article with all code examples is at [usertourkit.com/blog/tour-kit-sentry-error-tracking](https://usertourkit.com/blog/tour-kit-sentry-error-tracking).

Key takeaways:

- Tour Kit's `onTourStart`, `onStepView`, `onTourComplete`, and `onTourSkip` callbacks map directly to `Sentry.addBreadcrumb()` calls
- Wrapping tours in `Sentry.ErrorBoundary` with `beforeCapture` tags lets you filter tour-only errors in the dashboard
- The `component:product-tour` tag enables dedicated Sentry alert rules for tour failures
- About 60 lines of TypeScript across two files for the complete integration
- Works with Tour Kit's free tier (MIT-licensed callbacks)

```bash
npm install @tourkit/core @tourkit/react @sentry/react
```

Read the full walkthrough with step-by-step code: [usertourkit.com/blog/tour-kit-sentry-error-tracking](https://usertourkit.com/blog/tour-kit-sentry-error-tracking)
