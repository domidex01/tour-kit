## Subreddit: r/reactjs

**Title:** I wrote up the 4 different ways to calculate feature adoption rate, with TypeScript implementations

**Body:**

Been working on adoption tracking for a React library I maintain and realized there's no good developer-oriented resource on how to actually calculate feature adoption rate. The product analytics blogs (Appcues, Userpilot, Pendo) all explain the concept but never show code.

So I wrote up the four main formula variants with TypeScript:

- **Standard:** `(Feature Users / Total Active Users) × 100` — works for universally available features
- **Eligible-user:** Same formula but with only users who have access as the denominator. For gated features, this changes a "20% adoption" into "50% adoption" depending which denominator you pick
- **Depth-adjusted:** Requires a minimum engagement threshold (convention is 3 uses in 30 days) before counting someone as an "adopter"
- **Velocity:** Tracks whether adoption is accelerating or stalling — `(rate_T2 - rate_T1) / days`

Some interesting data from the Userpilot benchmark report (n=181 companies):
- Median core feature adoption: 16.5%
- Average: 24.5%
- The gap between where teams target (60-80%) and reality (24.5%) is almost entirely a discoverability problem

Also covered: Smashing Magazine's TARS framework (Target Audience, Adoption, Retention, Satisfaction) which is a more nuanced approach that no one in the dev community seems to be talking about.

The article includes a custom React hook for tracking, plus how to wire it into PostHog/Mixpanel.

Full article with all code examples and benchmark tables: https://usertourkit.com/blog/calculate-feature-adoption-rate

Would be curious what thresholds other teams use for "adopted" — is 3x in 30 days the standard, or do you use something different?
