## Subreddit: r/reactjs

**Title:** I built typed custom event tracking for product tours — here's the pattern

**Body:**

I've been working on analytics for a product tour library and kept running into the same problem: the built-in lifecycle events (tour started, step viewed, tour completed) tell you about the *structure* of the tour, but not what users actually do inside each step.

The fix was surprisingly simple. The `step_interaction` event type + a `metadata` field on every event gives you a hook point. Layer a TypeScript discriminated union on top of the metadata and you get compile-time checks for every custom interaction:

```tsx
export interface CtaClickMeta {
  interactionType: 'cta_click'
  ctaId: string
  ctaLabel: string
}

export function trackCtaClick(analytics, tourId, stepId, meta) {
  analytics.stepInteraction(tourId, stepId, 'cta_click', {
    interactionType: 'cta_click',
    ...meta,
  })
}
```

The whole thing adds zero bytes to the bundle (types compile away, helpers are thin wrappers). Each event payload is ~200 bytes. A 5-step tour with 2 interactions per step generates ~15 events.

One gotcha worth sharing: if you're sending to PostHog, keep metadata flat (one level of key-value pairs). Nested objects don't get indexed for filtering. Learned that one the hard way.

The pattern works with any analytics backend through a plugin interface — PostHog, Mixpanel, GA4, or a custom endpoint. The plugin just implements a `track(event)` method.

Full writeup with 6 code examples, a comparison table, and troubleshooting section: https://usertourkit.com/blog/custom-events-tour-analytics-react

Happy to answer questions about the analytics architecture if anyone's building something similar.
