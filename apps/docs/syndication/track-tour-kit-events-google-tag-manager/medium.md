*Originally published at [usertourkit.com](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)*

# How to route product tour events into Google Tag Manager

*A 28-line TypeScript plugin that connects Tour Kit's analytics to GTM's dataLayer*

Your product tour runs. Users click through steps, skip some, finish others. But none of that data reaches your marketing tags or conversion pixels because GTM doesn't know about any of it.

Google Tag Manager processes events through `window.dataLayer`. If your tour library doesn't push structured events there, GTM can't fire tags. Over 60% of GA4 implementations have configuration issues producing unreliable data.

Tour Kit's analytics package tracks 6 lifecycle events. This tutorial builds a custom plugin that routes those events into GTM's dataLayer, then configures Custom Event triggers and GA4 tags to forward them.

## The plugin (28 lines)

The plugin implements Tour Kit's `AnalyticsPlugin` interface. It receives structured event objects and pushes them to `window.dataLayer` with an `event` key (required for GTM triggers to fire) and snake_case parameter names matching Google's conventions.

Every push must include the `event` key. Without it, GTM stores the data but no trigger fires. That's the most common debugging headache.

## GTM configuration

You need three things in GTM's workspace:

1. **Data Layer Variables** for `tour_id`, `step_id`, `step_index`, `total_steps`, `duration_ms`, and `session_id`
2. **Custom Event Triggers** matching `tour_started`, `step_viewed`, `tour_completed`, `tour_skipped`, and `step_skipped`
3. **GA4 Event Tags** forwarding the parameters to your property

Event names are case-sensitive. `tour_started` won't match `Tour_Started`.

## Debugging with Preview Mode

GTM's Preview Mode (Tag Assistant) lets you inspect every dataLayer push in real time. Enter your app URL, trigger a tour, and verify each event appears with correct variable values and fired tags. Cross-check with GA4 DebugView for end-to-end confirmation.

## Common gotchas for React SPAs

React Router and Next.js dispatch multiple history events per navigation. Don't use GTM's History Change trigger for tour events. Custom Event triggers fire only when your code explicitly calls `dataLayer.push`.

For Next.js App Router, guard the analytics initialization with `typeof window !== 'undefined'` since `window.dataLayer` doesn't exist during server-side rendering.

If you see duplicate events, check whether you're running both a direct GA4 plugin and the GTM plugin simultaneously. That creates two paths to the same property.

## Consent Mode v2

As of March 2024, Google requires Consent Mode v2 for EU users. Always push events to the dataLayer regardless of consent state. GTM gates which tags fire based on consent configuration. Your plugin's job is to push data. GTM's job is to decide what to do with it.

---

Full tutorial with complete code examples, GTM configuration tables, and event schema reference: [usertourkit.com/blog/track-tour-kit-events-google-tag-manager](https://usertourkit.com/blog/track-tour-kit-events-google-tag-manager)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium*
