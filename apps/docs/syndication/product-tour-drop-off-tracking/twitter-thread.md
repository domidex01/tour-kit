## Thread (6 tweets)

**1/** 4-step product tours complete at 74%.

Add one more step and it drops to 34%.

One step. Half your users gone.

Here's how to find your tour's broken step: (thread)

**2/** Most tour analytics track one metric: completion rate.

That's like tracking "revenue" without knowing which product sells. You know the number but can't diagnose anything.

Step-level drop-off tracking fixes this.

**3/** The setup: fire a `step_viewed` event on every step transition. Compare counts in a funnel.

The step with the biggest gap between "users reached" and "users advanced" is your problem.

Time-on-step tells you WHY:
- 2s exit = uninterested
- 45s exit = confused

**4/** The universal worst-performing step: "Invite your team."

Users want to see value before committing socially. Move social actions to a secondary flow and watch your completion rate recover.

**5/** Quick wins from Chameleon's 550M interaction dataset:

- Progress indicators: +12% completion
- Click triggers vs delay triggers: 67% vs 31% completion
- Keep tours under 5 steps
- Skip != abandon (track both separately)

**6/** Full implementation with React code, PostHog/Mixpanel funnel setup, and a custom drop-off alert plugin:

https://usertourkit.com/blog/product-tour-drop-off-tracking
