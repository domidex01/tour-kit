## Subreddit: r/reactjs

**Title:** We've been measuring product tour success wrong — completion rate is a vanity metric

**Body:**

I spent a couple weeks researching how teams A/B test their product tours, and the biggest takeaway was that almost everyone optimizes for tour completion rate. It's the default metric in Appcues, Pendo, UserGuiding — basically every dashboard.

The problem: a tour that auto-advances shows high completion. A tour that hides the dismiss button shows high completion. Neither tells you if the user actually learned to use the feature.

The median completion rate for a 5-step tour is 34% (Product Fruits data). But the metric that actually matters is the downstream activation event — "did the user create their first dashboard within 24 hours?" instead of "did they click Next five times?"

Some practical things I found useful while implementing this:

- Feature flags are the cleanest way to split tour variants. PostHog and GrowthBook both have React SDKs with sticky bucketing.
- For a 500 DAU SaaS app, you need roughly 11 days to detect a 7-point lift at 95% confidence. Most teams stop way too early.
- Both variants need to pass WCAG 2.1 AA independently — nobody talks about accessibility in the context of A/B testing tours.
- The "peeking problem" is real: checking results daily inflates false-positive rates from 5% to 30%.

I wrote up the full methodology with sample size calculations and a feature flag implementation pattern: https://usertourkit.com/blog/ab-test-product-tour

Curious if anyone else has A/B tested their onboarding tours — what metrics did you end up using as your primary?

---

## Subreddit: r/ProductManagement

**Title:** A/B testing product tours: why completion rate is the wrong primary metric

**Body:**

Put together a guide on how to properly A/B test product tours after seeing too many teams (including ours) optimize for the wrong thing.

The median tour completion rate is 34% for 5-step tours. Most teams see that number and try to push it higher. But completion measures whether someone clicked through the tour, not whether they actually did the thing the tour was teaching.

The better primary metric: the downstream activation event. "Created first dashboard within 24 hours" instead of "finished the tour." A tour with 40% completion and 30% activation is better than one with 80% completion and 12% activation.

Key findings from the research:

- 57% of leaders say onboarding friction directly impacts revenue (OnRamp 2026 report)
- Removing friction from onboarding improved completion by 22% and reduced churn by 18% (Product Fruits data)
- There's no universal completion rate benchmark — a DAP expert across WalkMe, Pendo, and Appcues confirmed this on the Intercom forum
- Most SaaS teams stop tests too early. A 500 DAU app needs ~11 days for a statistically significant result.

Full methodology with sample size calculations: https://usertourkit.com/blog/ab-test-product-tour

What metrics does your team use to evaluate onboarding tours?
