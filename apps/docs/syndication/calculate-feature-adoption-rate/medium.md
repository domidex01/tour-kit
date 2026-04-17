# How to Calculate Feature Adoption Rate (With Code Examples)

## Four formulas, React hooks, and benchmarks from 181 SaaS companies

*Originally published at [usertourkit.com](https://usertourkit.com/blog/calculate-feature-adoption-rate)*

You shipped a new feature last sprint. Product wants to know if anyone's using it. The PM asks for "the adoption rate." Sounds straightforward until you realize there are at least four different formulas, each producing a different number from the same data.

Feature adoption rate measures what percentage of your users have meaningfully engaged with a specific capability. The keyword is "meaningfully." A user clicking a button once during an accidental hover isn't adoption.

## The four formulas

**Standard:** `(Feature Users / Total Active Users) × 100`

Works for features available to everyone. 300 users tried chat out of 1,000 total = 30%.

**Eligible-user variant:** `(Feature Users / Eligible Users) × 100`

For gated features. 200 paid users out of 400 paid total = 50% (vs 20% if measured against all 1,000 users). Very different signal.

**Depth-adjusted:** Filter by minimum engagement threshold. The industry convention is 3 uses within 30 days, but the right threshold depends on the feature type.

**Velocity:** `(Rate at T2 - Rate at T1) / Days`. Tracks whether adoption is accelerating or stalling. Top-quartile SaaS products hit 7-10% daily velocity during core feature launches.

## What the benchmarks say

The median core feature adoption rate across B2B SaaS is 16.5%, with an average of 24.5% (Userpilot 2024, n=181 companies). Pendo considers 28% a "good" rate.

Core features should target 60-80%. Secondary features: 30-50%. Niche features: 5-30%.

The gap between target (60-80%) and reality (24.5%) for core features represents a discoverability problem. Users don't reject features. They never find them.

## Five ways to improve the number

1. Fix discoverability first. As Smashing Magazine's TARS research notes, "Sometimes low feature adoption has nothing to do with the feature itself, but rather where it sits in the UI."

2. Segment your denominator. Use eligible-user or target-user formula instead of total users.

3. Set different thresholds per feature type. A search bar vs a quarterly report need different criteria.

4. Measure time-to-adopt, not just adoption rate. Litmus saw a 22x increase by targeting users within their first 72 hours.

5. Check accessibility. Features with accessibility gaps have artificially low adoption rates because some users physically cannot use them.

---

Full article with TypeScript implementations, React hooks, and tool comparison table: [usertourkit.com/blog/calculate-feature-adoption-rate](https://usertourkit.com/blog/calculate-feature-adoption-rate)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Towards Data Science (for the metrics angle)*
