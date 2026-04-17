## Subreddit: r/SaaS (primary), r/analytics (secondary)

**Title:** I compiled retention benchmarks for onboarding at week 1, week 4, and week 12 — here's what the data shows

**Body:**

I've been digging into onboarding retention data from Mixpanel's 2025 benchmarks, Amplitude's product reports, and Appcues' cohort studies. Most of the "retention benchmark" content out there gives you a single number (like "aim for 40% day-7 retention") without context on what happens at the critical inflection points.

Here's what I found across the sources:

- **Median SaaS**: 35% week 1, 18% week 4, 15% week 12
- **Top quartile B2B SaaS**: 60% week 1, 40% week 4, 30% week 12
- **Developer tools**: 45% week 1, 28% week 4, 20% week 12
- **Freemium products**: 25% week 1, 12% week 4, 8% week 12

The most useful thing I took away: measuring completers vs. skippers as separate cohorts. The delta between those two groups isolates onboarding's actual impact from self-selection (motivated users complete tours AND retain better). Without that split, you're measuring correlation.

Also interesting: developer tools have higher week 1 retention than general SaaS but a steeper week 4 drop. There's an "integration cliff" where devs decide whether to commit to the learning curve or bail.

I wrote up the full analysis with formulas, the completer-vs-skipper methodology, and fixes for when each checkpoint underperforms: https://usertourkit.com/blog/retention-analytics-onboarding-week-1-week-4-week-12

Curious what retention numbers others are seeing, especially for dev tools.
