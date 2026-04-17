## Thread (6 tweets)

**1/** Most product tours are black boxes. Users start step 1... and you hope they finish. Here's how to get per-step drop-off data using Mixpanel funnels in React.

**2/** The setup: fire `tour_step_completed` events with step names on each transition. Build a Mixpanel funnel with the exact step sequence. Set a 30-min conversion window. You get per-step conversion percentages automatically.

**3/** The surprise finding: in a 5-step onboarding tour, the "invite teammates" step had a 38% drop-off. Users weren't ready to collaborate during onboarding. Moving it to a post-onboarding nudge recovered 22% of completions.

**4/** Pro tip: `mixpanel.time_event("tour_completed")` starts a timer that auto-attaches duration when the matching event fires. Free step-timing data without manual timestamp math.

**5/** The economics work too. A 5-step tour with 3 events/step = 15 events per session. At 10K MAU that's 150K events/month. Mixpanel free tier allows 1M.

**6/** Full tutorial with code, user identification for cohort analysis, and feature adoption tracking: https://usertourkit.com/blog/mixpanel-product-tour-funnel
