## Title: GA4 has no recommended event for product tours – here's how to wire typed custom events to React onboarding flows

## URL: https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding

## Comment to post immediately after:

I built Tour Kit, a headless product tour library for React, and kept running into the same question from users: how do I track where people drop off during onboarding?

GA4 has recommended events for e-commerce (add_to_cart, purchase) but nothing for product tours or onboarding flows. You need custom events, and the implementations I kept seeing in the wild were fragile — raw `window.gtag()` calls scattered through components that break silently when someone refactors.

The tutorial covers wiring Tour Kit's analytics plugin to GA4 with typed events, building funnel explorations with GA4's open funnel feature (underused for non-linear onboarding), and a reference table of GA4's hard limits (500 event names, 25 params/event, 100-char silent truncation).

One stat that surprised me during research: over 60% of GA4 implementations have configuration issues that produce unreliable data (Tatvic Analytics, 2026). The most insidious one for custom events is that they fail silently — events stop firing and GA4 doesn't alert you.

Disclosure: I built Tour Kit, so I'm biased. The GA4 plugin approach described here could work with any tour library that exposes lifecycle callbacks.
