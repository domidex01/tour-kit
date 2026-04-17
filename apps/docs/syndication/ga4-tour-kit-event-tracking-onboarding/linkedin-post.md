GA4 has recommended events for e-commerce but nothing for product tours or onboarding flows.

If you're tracking onboarding completion in a React app, you're writing custom events from scratch. And over 60% of GA4 implementations have configuration issues (Tatvic Analytics, 2026).

I wrote a tutorial on wiring typed GA4 custom events to product tours using Tour Kit's analytics plugin. The approach: 6 lifecycle events with structured parameters, one provider setup, zero per-tour configuration.

The part I found most useful to document: GA4's hard limits that aren't obvious until they bite you. 500 event names per property. 100-character silent truncation on parameter values. 24-48 hour report processing delay. And open funnels vs closed funnels for non-linear onboarding.

Full tutorial with TypeScript examples and a GA4 limits reference table: https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding

#react #googleanalytics #ga4 #productdevelopment #onboarding #typescript
