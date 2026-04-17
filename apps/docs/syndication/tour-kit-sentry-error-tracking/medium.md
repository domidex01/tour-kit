# How to catch product tour errors before users report them

## Wire Sentry breadcrumbs to your React tour lifecycle for proactive error monitoring

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-sentry-error-tracking)*

Product tours interact with the DOM in brittle ways. They query selectors, calculate positions relative to moving targets, and overlay UI on top of content that might not exist yet. When a tour breaks, the failure is usually silent. Users don't file bug reports for "the onboarding thing didn't show up." They just leave.

Sentry captures these failures with enough context to reproduce them. The React SDK (about 30KB gzipped, 2.1M weekly npm downloads as of April 2026) includes an error boundary component, a performance profiler, and hooks for adding breadcrumbs and tags to error events.

This tutorial connects Tour Kit's lifecycle callbacks to Sentry breadcrumbs, wraps tours in error boundaries with context tags, and sets up alert rules for tour-specific failures.

## The core idea

Tour Kit fires typed callbacks on every lifecycle event: tour start, step view, tour complete, tour skip. Each callback receives the tour ID, step ID, and step index. By mapping these to `Sentry.addBreadcrumb()`, every error report during an active tour includes a trail showing exactly which tour and step was active when things broke.

The integration is about 60 lines of TypeScript across two files:

1. A callbacks object that adds breadcrumbs and sets Sentry tags
2. An error boundary wrapper that tags tour errors as `component:product-tour`

## Why this matters

Tour errors are a specific category of UI failure that traditional error monitoring misses. A querySelector returning null because the target element hasn't mounted yet isn't a thrown exception. It's a silent failure that cascades. According to Sentry's 2024 developer survey, teams using structured error monitoring resolve frontend issues 2.3x faster than those relying on user reports.

The `component:product-tour` tag lets you create a dedicated Sentry alert rule. Tour failures ping your frontend channel in Slack before users even notice something's wrong.

## Read the full walkthrough

The complete tutorial with all code examples, the error boundary component, and the analytics plugin variant is at [usertourkit.com/blog/tour-kit-sentry-error-tracking](https://usertourkit.com/blog/tour-kit-sentry-error-tracking).

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
