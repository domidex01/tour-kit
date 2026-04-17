## Subreddit: r/SaaS (primary), r/ProductManagement (secondary)

**Title:** I broke down product tour ROI into 4 separate formulas — here's the math

**Body:**

My PM asked me to justify our product tour investment with actual numbers. Every "ROI guide" I found gave the same useless formula: (Gains - Costs) / Costs. Thanks, very helpful.

So I did the work myself. Turns out "gains from product tours" isn't one number — it's four separate calculations depending on what you're measuring:

1. **Activation lift** — how many extra users hit your activation event because of the tour. Highest confidence. Average SaaS activation rate is 36% (Userpilot data), so if you're below that, a well-designed tour has room to move the needle.

2. **Churn prevention** — revenue saved by reducing early dropout. 70% of SaaS users churn within 90 days (UserGuiding). The trick is comparing cohorts who saw the tour vs didn't, not just before/after.

3. **Support ticket deflection** — money saved when tours preempt questions. Average ticket costs $15-25 (Zendesk). Easiest to measure, hardest to argue with.

4. **Expansion revenue** — MRR from feature tours driving upgrades. Highest value, lowest attribution confidence.

The key insight: you need to discount everything by 30-50% for attribution unless you're running a proper A/B test. Most teams over-attribute to tours because completers are self-selected motivated users.

Worked example: 1,000 monthly signups, $600 ACV, 12-point activation lift. Raw ROI is 3,442%. Discounted at 40% attribution: still 1,357%.

The benchmarks that matter: tour completion averages 61% (Chameleon, 550M interactions), action-based tours get 123% higher completion than click-through.

Full writeup with code examples for tracking this in React: https://usertourkit.com/blog/roi-product-tour-formula

Curious how others approach this — do your teams actually measure tour ROI or just track completion rate and call it a day?
