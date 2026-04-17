## Thread (6 tweets)

**1/** The median core feature adoption rate across B2B SaaS is 16.5%.

Most teams target 60-80% for core features. The gap isn't about feature quality — it's about discoverability.

Here are 4 ways to actually measure it, with TypeScript code:

**2/** Formula 1: Standard
`(Feature Users / Total Active Users) × 100`

But this breaks for gated features. 200 users out of 400 paid = 50%. Same 200 out of 1,000 total = 20%.

Which number do you report to your PM? It matters.

**3/** Formula 2: Depth-adjusted
Filter by minimum engagement: 3 uses within 30 days.

This cuts the "accidental clickers" from your numbers. A daily workflow tool needs weekly usage. A reporting feature needs monthly. One threshold doesn't fit all.

**4/** Formula 3: Velocity
`(rate_T2 - rate_T1) / days`

Top-quartile SaaS products hit 7-10% daily velocity during launches.

If yours drops below 1%/day in the first two weeks, you have a discovery problem, not a feature problem.

**5/** The most surprising benchmark finding:

Sales-led companies (26.7%) slightly outperform product-led ones (24.3%) on feature adoption.

The assumption that PLG drives higher adoption doesn't hold up in the data (Userpilot 2024, n=181).

**6/** Full article with all 4 TypeScript implementations, React hooks, benchmark tables by industry, and 5 practical ways to improve the number:

https://usertourkit.com/blog/calculate-feature-adoption-rate
