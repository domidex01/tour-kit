## Title: 70% of SaaS churn happens in the first 90 days

## URL: https://usertourkit.com/blog/what-is-churn-rate

## Comment to post immediately after:

I wrote this after digging through the 2026 SaaS churn benchmarks from a study of 500+ companies. A few things surprised me:

1. The gap between segments is massive. Enterprise churns at 0.5-1% monthly, while SMBs run 3-7%. EdTech is the worst vertical at 9.6% monthly.

2. Monthly-to-annual compounding is unintuitive. 5% monthly isn't 60% annual — it's ~46%. The formula is `1 - (1 - rate)^12`.

3. The onboarding-churn connection is stronger than I expected. Full onboarding completers retain at 82% vs. 19% for partial. Google documented a Firebase Remote Config A/B test where optimizing onboarding lifted day-one retention by 27%.

I build an open-source product tour library (Tour Kit), so I'm naturally focused on the onboarding angle. But the third-party data consistently points to the first 90 days as where most churn is decided. Interested in hearing if this matches what others have seen.
