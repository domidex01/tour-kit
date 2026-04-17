## Thread (6 tweets)

**1/** GA4 has recommended events for e-commerce. For product tours? Nothing. Here's how to wire typed custom events to your React onboarding flow in 40 lines of TypeScript.

**2/** The problem: over 60% of GA4 implementations have config issues (Tatvic Analytics, 2026). Custom events fail silently — they stop firing and GA4 doesn't tell you. Tour Kit's analytics plugin catches this with debug-mode logging before events hit GA4.

**3/** The setup: 6 typed events cover the full tour lifecycle. tour_started, step_viewed, step_completed, tour_completed, tour_skipped, tour_abandoned. Each with structured params (tour_id, step_index, duration_ms). That's 1.2% of GA4's 500 event name budget.

**4/** GA4 gotcha most tutorials skip: parameter values are silently truncated at 100 characters. And parameters with 500+ unique values get bucketed into an "(other)" row. Plan your event schema before you ship.

**5/** Underrated GA4 feature for onboarding: open funnels. Closed funnels require step 1 first. Open funnels count users from wherever they join — which matters when 20-30% of users re-enter mid-flow.

**6/** Full tutorial with code examples, provider wiring, DebugView verification, GA4 limits reference table, and troubleshooting guide: https://usertourkit.com/blog/ga4-tour-kit-event-tracking-onboarding
