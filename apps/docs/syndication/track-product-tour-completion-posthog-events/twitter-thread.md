## Thread (6 tweets)

**1/** Most product tours have a "completion rate" metric. It's a vanity number. Here's what actually matters — and how to track it with PostHog + React.

**2/** Median 5-step tour completion: ~34%. Launcher-driven tours: ~67%. But completion alone doesn't tell you if the tour works. You need to compare: do completers activate at higher rates than skippers?

**3/** The setup: wrap your tour callbacks (onStart, onComplete, onSkip, onStepChange) with posthog.capture(). Five event types, structured properties, ~60 lines of TypeScript. Each event carries tour_id, step_index, timestamps, completion_pct.

**4/** The trick: set a person property on completion (tour_completed_{id}: true). Then build PostHog cohorts — "completers" vs "skippers" — and compare against your activation metric. That's where you learn if the tour matters.

**5/** PostHog's built-in product tours are still in private alpha (no-code only). For custom React tours, capture() gives you more flexibility. And the free tier covers ~142K tour sessions/month.

**6/** Full tutorial with code, funnel setup, troubleshooting, and FAQ:

https://usertourkit.com/blog/track-product-tour-completion-posthog-events
