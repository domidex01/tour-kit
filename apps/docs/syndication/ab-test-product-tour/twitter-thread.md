## Thread (6 tweets)

**1/** The median product tour completion rate is 34%.

Most teams try to push that number higher. That's the wrong goal.

Here's what to A/B test instead:

**2/** Tour completion measures clicking. Not learning.

A tour that auto-advances on a timer shows high completion. A tour that hides "Skip" shows high completion.

Neither tells you if the user actually used the feature afterward.

**3/** The right primary metric: the downstream activation event.

"Created first dashboard within 24 hours" > "Finished the tour"

A tour with 40% completion + 30% activation beats one with 80% completion + 12% activation. Every time.

**4/** Most SaaS teams stop tests too early.

For 500 DAU, a 7-point lift needs ~380 users per variant = ~11 days minimum.

Checking results daily? Your false-positive rate jumps from 5% to 30%. Set the duration upfront. Don't peek.

**5/** The gap nobody covers: accessibility during A/B testing.

Both tour variants must meet WCAG 2.1 AA independently. Focus management, keyboard nav, ARIA live regions, 4.5:1 contrast.

If variant B breaks accessibility, it doesn't matter if it "won."

**6/** Full guide with feature flag implementation, sample size calculator, and React SPA patterns:

https://usertourkit.com/blog/ab-test-product-tour
