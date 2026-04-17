## Title: Typed custom events for product tour analytics in React

## URL: https://usertourkit.com/blog/custom-events-tour-analytics-react

## Comment to post immediately after:

This tutorial covers a problem I kept hitting while building analytics for a product tour library: lifecycle events (tour started, step completed) don't capture what users actually do inside each step.

The approach uses TypeScript discriminated unions on a metadata field to get compile-time checking for custom interactions (CTA clicks, video plays, form submissions). The typed helpers are 4-8 line wrapper functions with zero bundle cost.

A few specific things that might be interesting to this crowd:

- The plugin interface has 5 methods (only `track` required), so building a custom backend adapter is ~40 lines
- `navigator.sendBeacon` in the plugin's `destroy()` method handles the page-close edge case (97.4% browser support, W3C guarantees delivery up to 64KB)
- Batching: a 5-step tour with 2 custom interactions generates ~15 events, flushed in groups of 10

Expedia Group's engineering team wrote about a closely related problem — common components knowing an event occurred but lacking the context to populate required analytics fields. Tour Kit's provider architecture solves this by automatically injecting tour-level context (tour ID, step index, session ID).

The biggest gotcha we found: PostHog silently drops nested metadata objects during property indexing. Keep everything flat.
