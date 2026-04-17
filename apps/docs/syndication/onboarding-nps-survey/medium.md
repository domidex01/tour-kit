# Onboarding NPS: when to ask, how to calculate, and what to do next

## Most teams collect the score and ignore it. Here's how to close the loop.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-nps-survey)*

Most teams ship an NPS survey after onboarding, glance at the number, and move on. The score sits in a dashboard somewhere. Detractors churn. Promoters never get asked for a referral. And the product team wonders why activation isn't improving.

The problem isn't collecting NPS. It's knowing when to ask, how to calculate it without misleading yourself, and what to actually do when a user scores you a 3.

This guide covers timing, calculation, benchmarks, and the closed-loop actions that turn a vanity metric into a retention signal.

## What is an onboarding NPS survey?

An onboarding NPS survey is a single-question feedback mechanism triggered after a user completes their initial product setup, asking "How likely are you to recommend this product?" on a 0-10 scale. Unlike generic NPS sent quarterly to your entire user base, onboarding NPS isolates the first-run experience and measures whether new users reached value before forming an opinion.

According to Bain & Company, relationship NPS benchmarks average between 20 and 50 for B2B SaaS, but onboarding-specific scores tend to run 10-15 points lower because users haven't yet experienced the product's full value.

## The calculation (and common mistakes)

**NPS = % Promoters (9-10) - % Detractors (0-6)**

Passives (7-8) don't factor into the formula, but ignoring them is a mistake. They're the swing vote.

Common mistakes that skew your score:

- Surveying too early (before onboarding completes)
- Surveying too late (after 7+ days, signal gets diluted)
- Low sample size (need 30+ responses for directional confidence)
- Ignoring the follow-up question ("What's the main reason for your score?")

## What good looks like

B2B SaaS products with self-serve onboarding typically score between 20-40 on onboarding NPS. Enterprise products with guided onboarding score 30-55 because a CSM smooths the rough edges. Developer tools tend to land lower (15-30) because developers are harsher critics.

Scores above 50 are excellent. Below 10 signals a broken flow. Negative means more detractors than promoters.

## Five ways to actually improve the score

**1. Close the loop within 48 hours.** Detractors who hear back from a human within 48 hours are 2.3x more likely to stay.

**2. Segment by onboarding path.** If users who complete the interactive tour score 15 points higher than users who skip it, the skip rate is the problem.

**3. Fix the step before the drop.** Pair NPS data with per-step analytics to find where onboarding breaks.

**4. A/B test the flow, not the question.** You need roughly 200 responses per variant to detect a 10-point difference with 95% confidence.

**5. Track trends, not snapshots.** Plot weekly NPS on a rolling 4-week average and correlate with what shipped.

---

Full article with TypeScript code examples, benchmark tables, and React implementation: [usertourkit.com/blog/onboarding-nps-survey](https://usertourkit.com/blog/onboarding-nps-survey)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Towards Dev*
