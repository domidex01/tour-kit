## Thread (6 tweets)

**1/** Your product tour's 61% completion rate is a vanity metric.

Two users "complete" the same tour. One spent 45 seconds per step. The other clicked through 5 steps in 8 seconds.

Both count as completed. Only one predicts retention. 🧵

**2/** Chameleon analyzed 15M tour interactions. The trigger type gap is wild:

- Click-triggered: 67% completion
- Checklist-triggered: +21% over baseline
- Auto-popup: 31% completion

That's 2x from trigger type alone. But does completion even predict retention?

**3/** The step count cliff is real:

- 3 steps: 72%
- 4 steps: 74% (sweet spot)
- 5 steps: 34%
- 7+ steps: 16%

Cognitive load research backs this — working memory holds 5-7 items.

**4/** Slack found that teams sending 2,000+ messages retained dramatically better. They rebuilt onboarding around that behavior. 30-day retention jumped 17%.

The insight came from behavioral cohort analysis, not tour completion metrics.

**5/** The experiment you should run:

Split users into 4 cohorts:
1. Completed tour + used featured action
2. Completed tour + never used it
3. Abandoned at step N
4. Skipped tour entirely

Compare day-30 retention across all four. That's where the signal is.

**6/** Full guide with code examples for piping tour events into PostHog/Amplitude/Mixpanel for cohort analysis:

https://usertourkit.com/blog/cohort-analysis-product-tour

Includes a cohort window table for different SaaS types (daily-use vs enterprise vs event-driven).
