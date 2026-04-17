# Cohort analysis for product tours: finding what works

## Your tour's completion rate is hiding the truth about retention

*Originally published at [usertourkit.com](https://usertourkit.com/blog/cohort-analysis-product-tour)*

Your product tour has a 61% completion rate. But does that number actually predict whether users stick around past week two?

Completion rate is a vanity metric without context. A user who clicked through five tooltip steps in eight seconds and a user who paused, explored each feature, and came back the next day both count as "completed." Cohort analysis separates the two and tells you which tour design actually drives retention.

We ran this analysis on our own onboarding flows and the results were not what we expected.

## The false positive problem

The average product tour completion rate sits at 61%, based on Chameleon's analysis of 15 million interactions. Sounds healthy. But the median SaaS app loses 75% of its daily active users within the first week. If your tour completers churn at nearly the same rate as non-completers, the tour isn't doing its job.

Here's what happened at Slack. Their growth team identified that teams sending 2,000+ messages retained at dramatically higher rates. They rebuilt onboarding to push new teams toward that behavior faster. 30-day retention jumped 17%. The insight came from behavioral cohort analysis, not from measuring whether people finished a welcome tour.

## Four cohort types that actually work

**Acquisition cohorts** group users by signup week. Useful for catching the impact of tour changes over time, but too noisy for measuring tour effectiveness.

**Behavioral cohorts** are the most powerful split. Group users by what they did during or after the tour: completed and activated, completed but didn't activate, abandoned at step 3, or skipped entirely. Then run retention curves for each group.

**Trigger-type cohorts** are the dimension most teams miss. Click-triggered tours complete at 67%. Auto-popup tours complete at 31%. That's a 2x gap from trigger type alone.

**Tour-length cohorts** reveal the step count cliff: 4-step tours hit 74% completion, while 5-step tours drop to 34%. Cognitive load research backs the pattern.

## The experiment you should run

Cohort-split your users by trigger type and measure retention at day 30. Users who chose to start a tour have higher intent, meaning completion is a genuine engagement signal rather than a dismissal pattern.

Then add dwell time per step. Two users "complete" the same tour, but one spent 45 seconds per step while the other clicked through in 8 seconds. Only a cohort split surfaces which pattern predicts retention.

## Common mistakes

**Survivorship bias.** Users who complete a 5-step tour are already more engaged than average. Compare completers against a hold-back group who never saw the tour, not against non-completers.

**Wrong cohort window.** A daily-use tool needs Day 1/7/14/30 windows. An enterprise product with a 90-day sales cycle needs Week 1/4/12/26. The wrong window makes your tour look ineffective when it's actually working on a different timeline.

**Acquisition cohorts for effectiveness.** Acquisition cohorts are great for tracking changes to your tour. They're terrible for measuring whether the tour itself works, because every confounding variable (marketing campaigns, product changes) is baked in.

## Getting started

The technical bridge between tour events and cohort analysis is simpler than most teams expect. Emit step-level events with tour_id, step_id, trigger_type, and dismissed_at_step properties. Build four behavioral cohorts in your analytics tool. Compare retention curves.

PostHog, Amplitude, and Mixpanel all support this. PostHog is open-source with a 1M events/month free tier.

---

*Full article with code examples, comparison tables, and a cohort window selection guide:* [usertourkit.com/blog/cohort-analysis-product-tour](https://usertourkit.com/blog/cohort-analysis-product-tour)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Towards Data Science*
