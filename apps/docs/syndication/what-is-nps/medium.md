# What is Net Promoter Score? The developer's version

### How NPS works, what the benchmarks actually are, and when to ask the question in your app

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-nps)*

Net Promoter Score is a single-question survey metric that measures how likely someone is to recommend your product. Rate from 0 to 10, group into three buckets, subtract the unhappy percentage from the happy one. You get a number between -100 and +100.

Fred Reichheld introduced NPS in a 2003 Harvard Business Review article. It remains the most recognized loyalty metric in SaaS, though only 23% of enterprise CX leaders still treat it as their primary metric (CMSWire, 2025).

For developers building onboarding flows, NPS is the quickest signal that your product tour actually helped.

## How the scoring works

Three groups based on a 0-10 rating. Promoters (9-10) actively recommend. Passives (7-8) are satisfied but unenthusiastic. Detractors (0-6) may discourage others.

The formula: NPS = (% Promoters) - (% Detractors)

100 users respond: 60 Promoters, 25 Passives, 15 Detractors. NPS = 60 - 15 = +45. Passives count toward the total but don't affect the calculation. The largest segment gets ignored.

## SaaS benchmarks

The average SaaS NPS is +36 (CustomerGauge, 2025). B2B SaaS averages +29, B2C software +47.

Reference points: Zoom +72, Snowflake +71, Slack +55, Salesforce +20. Only 3% of SaaS companies hit +70.

Below 0 means something is broken. 0-30 is normal for early stage. 30-50 is at or above average. 50+ means strong loyalty.

## Timing matters more than the question

The biggest mistake with NPS is asking at the wrong time. During a product tour interrupts the flow. Three months later measures something other than onboarding quality.

In-app NPS surveys get 20-40% response rates versus 5-15% for email (Refiner.io). Trigger after onboarding completes. Wait for 3+ sessions. Never ask more than once every 60 days.

One question plus one optional follow-up. That's enough signal without annoying anyone.

## NPS isn't a silver bullet

The 0-6 detractor range groups someone mildly disappointed (a 6) with someone who hates the product (a 0). Cultural norms affect scores by 15-20 points across regions (Qualtrics XM Institute). Passives, often your biggest segment, vanish from the math.

Use NPS as a directional signal alongside completion rates and time-to-value, not the single source of truth.

---

*Full article with code examples and implementation details: [usertourkit.com/blog/what-is-nps](https://usertourkit.com/blog/what-is-nps)*

**Submit to:** JavaScript in Plain English, Better Programming, or The Startup
