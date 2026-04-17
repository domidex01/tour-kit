# How to A/B Test Product Tours (and Why Completion Rate Is the Wrong Metric)

## Most teams track whether users finish the tour. Here's what to measure instead.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ab-test-product-tour)*

Most teams measure whether users finish a product tour. That's the wrong metric. A tour someone clicks through just to dismiss it shows 100% completion and zero activation. The real question isn't "did they finish?" but "did they do the thing the tour was supposed to teach them?"

The median completion rate for a 5-step product tour is 34%. But that number means nothing without knowing what happened after.

---

## The wrong metric is everywhere

Tour completion rate is the default metric in every onboarding analytics dashboard. Appcues shows it. Pendo shows it. UserGuiding shows it. And it's the wrong primary metric for A/B tests.

A tour that auto-advances on a timer will show higher completion than one that waits for user interaction. A tour with a prominent "Skip" button will show lower completion than one that buries the dismiss option. Neither tells you whether the user learned anything.

As a DAP expert on the Intercom community forum put it: "there is no single answer, not even a range of % of completion you should expect."

## What to measure instead

The primary metric for any product tour A/B test should be the **downstream activation event** — the action the tour was designed to teach. If your tour walks users through creating their first dashboard, the primary metric is "created first dashboard within 24 hours." Not "finished tour."

A 5-step tour with 80% completion and 12% activation is worse than one with 40% completion and 30% activation.

## The five-phase setup

**Phase 1: Establish the baseline.** Run your current tour unchanged for two weeks. Measure the activation event rate for users who saw the tour.

**Phase 2: Form a hypothesis.** Be specific: "Replacing the 7-step linear tour with a 3-step contextual tour will increase first-dashboard creation from 28% to 35% within 48 hours."

**Phase 3: Calculate sample size.** A SaaS app with 500 daily active users testing a 7-point lift needs about 380 users per variant, or roughly 11 days.

**Phase 4: Implement with feature flags.** Feature flags keep test logic out of your component tree and make cleanup straightforward.

**Phase 5: Don't peek.** Checking results daily and stopping early inflates your false-positive rate from 5% to as high as 30%.

## The mistakes that invalidate results

The five most common failure modes:

1. **Testing too many variables at once.** Change one thing per test.
2. **No sticky bucketing.** Users must stay in the same variant across sessions.
3. **Testing during anomalous periods.** Product launches and holidays skew everything.
4. **Ignoring novelty.** New variants always outperform initially. Wait two full weeks.
5. **Celebrating completion gains while activation stays flat.** 50% completion with identical activation means the tour just got easier to click through.

## What matters

Product Fruits found that removing friction from onboarding improved completion by 22% and reduced churn by 18%. Those numbers came from teams that tested. The teams that didn't test shipped the same underperforming tour for months.

57% of leaders say onboarding friction directly impacts revenue. That makes your product tour one of the most consequential UX surfaces in your entire product — and one of the least tested.

---

Full article with React code examples, sample size calculator, tool comparison table, and accessibility compliance guide: [usertourkit.com/blog/ab-test-product-tour](https://usertourkit.com/blog/ab-test-product-tour)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, UX Collective*
