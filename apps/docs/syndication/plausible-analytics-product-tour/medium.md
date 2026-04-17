# Track Product Tour Metrics Without Cookies or Consent Banners

## How to wire React tour events to Plausible Analytics for privacy-first onboarding data

*Originally published at [usertourkit.com](https://usertourkit.com/blog/plausible-analytics-product-tour)*

Your onboarding flow starts with a cookie consent banner. The user hasn't even seen your product yet and they're already making a trust decision. Roughly 55.6% of visitors reject or ignore consent prompts entirely, which means more than half your tour completion data never reaches Google Analytics.

Plausible is a privacy-first analytics tool that ships at ~1 KB, needs no cookies, and requires no consent banner under GDPR. That makes it a natural fit for product tour tracking where accuracy matters and first impressions shouldn't start with legal text.

This guide walks through integrating Plausible with Tour Kit (a headless React product tour library) to track tour events without sacrificing user privacy.

## The privacy advantage for onboarding

Here's what most teams miss: consent banners during onboarding create friction at exactly the worst moment. The user just signed up. They're trying to learn your product. And the first thing they see is a legal prompt.

Plausible eliminates this entirely. No cookies, no personal data, no consent required. Your tour completion data is also more accurate because you're not losing 55% of visitors to consent rejection.

As of April 2026, seven EU data protection authorities have ruled that Google Analytics violates GDPR due to US data transfers. Plausible processes data exclusively on EU servers.

## The event schema

Four event types cover the full tour lifecycle:

- **Tour Started** — fires on `onStart`, carries `tour_id` and `total_steps`
- **Tour Step Viewed** — fires on `onStepChange`, carries `tour_id`, `step_id`, `step_index`
- **Tour Completed** — fires on `onComplete`, carries `tour_id`, `total_steps`, `duration_sec`
- **Tour Dismissed** — fires on `onSkip`, carries `tour_id`, `dismissed_at_step`, `completion_pct`

One gotcha: custom events count toward your Plausible pageview quota. A 5-step tour generates 7-8 events per user. Budget accordingly.

## The integration pattern

A wrapper function maps Tour Kit's lifecycle callbacks to Plausible `trackEvent()` calls. You write it once and apply it to any tour definition:

```
function withPlausibleTracking(tour) {
  return {
    ...tour,
    onStart: (ctx) => {
      plausible.trackEvent('Tour Started', {
        props: { tour_id: ctx.tourId }
      })
      tour.onStart?.(ctx)
    },
    // ... same pattern for other callbacks
  }
}
```

The full typed implementation with all four callbacks is about 50 lines of TypeScript. All property values must be strings in Plausible's model.

## Reconstructing funnels

Plausible doesn't have a dedicated funnel visualization like PostHog. But you can reconstruct step-by-step drop-off by filtering the `Tour Step Viewed` event by the `step_index` property and comparing visitor counts.

The Stats API also supports programmatic access, so you can build funnel charts in your own admin dashboard.

## Event budgeting

This is the part most tutorials skip. A high-traffic app running multiple tours can burn through Plausible's allocation fast:

- All events (start + 5 steps + complete): 7 events/user → 70K for 10K monthly users
- Start + complete only: 2-3 events/user → 20-30K for 10K monthly users
- Complete + dismiss only: 1-2 events/user → 10-20K for 10K monthly users

Plausible starts at $9/month for 10K pageviews. Self-hosting under AGPL is free.

---

Full tutorial with complete TypeScript code, troubleshooting guide, ad blocker proxy setup, and FAQ: [usertourkit.com/blog/plausible-analytics-product-tour](https://usertourkit.com/blog/plausible-analytics-product-tour)

*Submit to: JavaScript in Plain English, Better Programming, or Towards Dev*
