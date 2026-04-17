## Subreddit: r/reactjs

**Title:** I compiled TTV benchmarks from 547 SaaS companies — here's what the data says about onboarding

**Body:**

I've been researching time to value (TTV) as a metric for onboarding effectiveness, and the data surprised me in a few places. Sharing the key findings.

**The core problem with completion rate:** 98% of users who don't experience product value within two weeks churn (Amplitude data). But most teams track "did the user finish the tour" instead of "did the user reach the aha moment." Those are very different things.

**Benchmarks (Userpilot, n=547):** Average TTV is 1 day 12 hours. Median is 1 day 1 hour. Top quartile hits under 5 minutes. The 7-day mark is basically a death sentence for retention.

**The counterintuitive bit:** PLG companies and sales-led companies have nearly identical TTV — about 1 day 12 hours vs 1 day 11 hours. Self-serve isn't inherently faster. What matters is how well you guide users to value.

**Tour length data (Chameleon, 15M interactions):** 3-step tours: 72% completion. 7+ steps: 16%. User-triggered tours outperform auto-triggered by 2-3x. Nearly 70% of users skip auto-triggered linear tours entirely.

I also put together the revenue formula: `Revenue acceleration = (current_TTV − target_TTV) × monthly_cohort_size × (ACV / 12)`. Companies cutting onboarding time by 30% recognized revenue 3 months sooner.

Full writeup with React code examples for instrumenting TTV tracking and the complete industry breakdown table: https://usertourkit.com/blog/time-to-value-onboarding-metric

Curious if anyone else has measured TTV directly — and what activation event you chose for your product.
