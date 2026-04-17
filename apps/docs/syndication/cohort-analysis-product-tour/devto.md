---
title: "Your product tour's 61% completion rate is lying to you"
published: false
description: "Completion rate is a vanity metric. Cohort analysis connects tour events to retention — here's how to build it with step-level tracking and behavioral segmentation."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/cohort-analysis-product-tour
cover_image: https://usertourkit.com/og-images/cohort-analysis-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/cohort-analysis-product-tour)*

# Cohort analysis for product tours: finding what works

Your product tour has a 61% completion rate. Congratulations. But does that number actually predict whether users stick around past week two?

Completion rate is a vanity metric without context. A user who clicked through five tooltip steps in eight seconds and a user who paused, explored each feature, and came back the next day both count as "completed." Cohort analysis separates the two and tells you which tour design actually drives retention.

We ran this analysis on our own onboarding flows and the results were not what we expected. This guide walks through building cohort analysis around product tour events: which cohort types matter, how to connect tour step data to your analytics tool, and what the benchmarks say about trigger types, step counts, and timing windows.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What is cohort analysis for product tours?

Cohort analysis for product tours groups users by shared tour-related behaviors (when they signed up, which tour variant they saw, how they triggered it, which step they reached) then compares retention, activation, or conversion rates across those groups over time. Unlike aggregate tour completion metrics that flatten all users into a single percentage, cohort analysis reveals *which specific tour experiences* correlate with long-term product engagement. As of April 2026, Chameleon's benchmark dataset of 15 million tour interactions shows that trigger type alone creates a 2x gap in completion rates ([Chameleon, 2025](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)), yet most teams never segment their tour data by trigger method.

Standard tour analytics answers "how many users finished the tour?" Cohort analysis answers a harder question: did tour completers retain better than tour skippers at day 30, and does the answer change depending on how we triggered the tour?

## Why cohort analysis matters for tour-driven onboarding

Product teams spend weeks crafting tour flows but measure success with a single metric: completion rate. That's like measuring a sales team by how many demos they booked without checking if any converted to paying customers. Cohort analysis connects the tour experience to the business outcome you actually care about, whether that's 30-day retention, feature adoption, or paid conversion. Without it, you're optimizing tours in the dark.

## Why tour completion rate alone misleads you

The average product tour completion rate sits at 61%, based on Chameleon's analysis of 15 million interactions. Sounds healthy. But the median SaaS app loses 75% of its daily active users within the first week ([Mixpanel, 2022 Product Benchmarks](https://mixpanel.com/blog/product-benchmarks/)). If your tour completers churn at nearly the same rate as non-completers, the tour isn't doing its job. The completion rate just hides that fact.

This is the false positive problem in tour analytics. High completion doesn't guarantee comprehension. Users clicking "Next" to dismiss a tooltip register identically to users who read each step and tried the feature. Only a cohort split (completers-with-feature-usage versus completers-without) surfaces the difference.

Here's what happened at Slack. Their growth team identified that teams sending 2,000+ messages retained at dramatically higher rates. They rebuilt onboarding to push new teams toward that behavior faster. Result: 30-day retention for new teams jumped 17%. The insight came from behavioral cohort analysis, not from measuring whether people finished a welcome tour.

## The four cohort types that matter

Not all cohort splits are equal. These four produce the most actionable signal when applied to product tour data.

### Acquisition cohorts

Group users by signup week or month, then compare tour completion rates across cohorts. This catches seasonal effects, marketing campaign quality shifts, and the impact of tour changes over time. If you shipped a new 3-step tour in March and your March cohort completes at 74% versus February's 58%, you've got a signal. But only if you also check whether March completers *retained* better, not just finished faster.

### Behavioral cohorts

The most powerful split for tour analysis. Group users by what they *did* during or after the tour:

- Completed tour and used the featured action within 24 hours
- Completed tour but never used the featured action
- Abandoned tour at step 3
- Skipped tour entirely

Then run retention curves for each group at day 7, 14, and 30. Users completing onboarding within the first 24 hours show 40% higher retention at 90 days in cohort analyses across SaaS products. But only behavioral cohorts tell you whether *your* tour is the mechanism driving that or just coincidental.

### Trigger-type cohorts

This is the cohort dimension most teams miss entirely. Chameleon's benchmark data shows stark differences by how a tour starts:

| Trigger type | Completion rate | Source |
|---|---|---|
| Click-triggered (user initiates) | 67% | Chameleon 15M benchmark |
| Launcher-driven | 67% | Chameleon 15M benchmark |
| Checklist-triggered | +21% vs baseline | Chameleon 15M benchmark |
| Auto-popup (set delay) | 31% | Chameleon 15M benchmark |

A 2x completion gap between click-triggered and auto-popup tours is massive. But the unanswered question, and the experiment you should run, is whether click-triggered completers also *retain* at higher rates. Users who chose to start a tour have higher intent, meaning completion is a genuine engagement signal rather than a dismissal pattern. Cohort-split by trigger type, measure retention at day 30, and you'll know.

### Tour-length cohorts

Step count matters more than most teams realize. The data from Chameleon's 2025 benchmark report across 550 million interactions:

- 3-step tours: 72% completion
- 4-step tours: 74% completion (the sweet spot)
- 5-step tours: 34% completion
- 7+ step tours: 16% completion

That cliff between 4 and 5 steps aligns with cognitive load research. People hold roughly 5 to 7 items in working memory ([Smashing Magazine, 2023](https://www.smashingmagazine.com/2023/04/design-effective-user-onboarding-flow/)). But completion isn't the whole story. Run a cohort comparing 3-step completers versus 4-step completers on 30-day retention.

## Piping tour events into cohort analysis

Most implementations have a technical gap where the tour library emits events and the analytics tool builds cohorts, but the two aren't connected at the step level. We hit this exact problem when measuring our own onboarding tours: Amplitude showed a 61% completion rate, but we couldn't answer whether completers retained any better than skippers. Here's how to bridge that gap with Tour Kit and any analytics platform.

### Emit granular tour events

```tsx
// src/components/TrackedTour.tsx
import { TourProvider, useTour } from '@tourkit/react';
import { useAnalytics } from '@tourkit/analytics';

const tourSteps = [
  { id: 'welcome', target: '#dashboard-header', title: 'Your dashboard' },
  { id: 'create-project', target: '#new-project-btn', title: 'Create a project' },
  { id: 'invite-team', target: '#invite-btn', title: 'Invite your team' },
];

function OnboardingTour() {
  const analytics = useAnalytics();

  return (
    <TourProvider
      tourId="onboarding-v3"
      steps={tourSteps}
      onStepChange={(step, prevStep) => {
        analytics.track('tour_step_viewed', {
          tour_id: 'onboarding-v3',
          step_id: step.id,
          step_index: tourSteps.indexOf(step),
          trigger_type: 'checklist',
          timestamp: Date.now(),
        });
      }}
      onComplete={() => {
        analytics.track('tour_completed', {
          tour_id: 'onboarding-v3',
          total_steps: tourSteps.length,
          trigger_type: 'checklist',
        });
      }}
      onDismiss={(step) => {
        analytics.track('tour_dismissed', {
          tour_id: 'onboarding-v3',
          dismissed_at_step: step.id,
          steps_completed: tourSteps.indexOf(step),
        });
      }}
    />
  );
}
```

The key properties: `tour_id`, `step_id`, `trigger_type`, and `dismissed_at_step`. These become your cohort dimensions.

### Build behavioral cohorts in your analytics tool

Once events flow, create these cohorts in Amplitude, Mixpanel, PostHog, or whichever tool your team uses:

1. **Completers**: users who fired `tour_completed` for a given `tour_id`
2. **Abandoners at step N**: users who fired `tour_step_viewed` for step N but never fired the event for step N+1
3. **Skippers**: users active in the same period who never fired any `tour_step_viewed` event
4. **Feature activators post-tour**: users who fired `tour_completed` AND performed the tour's target action within 24 hours

Compare retention curves across all four. If cohort 1 and cohort 4 look identical, the tour is informational but not activating. If cohort 4 retains 2x better than cohort 1, the tour works, but only when users act on it.

## Choosing the right cohort window

Picking the wrong retention window is the fastest way to misread your cohort data, so match the measurement period to how often people actually use your product.

| Product type | Cohort windows | Why |
|---|---|---|
| Daily-use SaaS (Slack, Linear) | Day 1, 7, 14, 30 | Fast feedback loops; churn signals appear within days |
| Weekly-use tools (project management, analytics) | Week 1, 2, 4, 8 | Weekly cadence means Day 1 retention is meaningless |
| Enterprise / long sales cycle | Week 1, 4, 12, 26 | 90-day evaluation periods; early inactivity isn't churn |
| Event-driven (invoicing, tax prep) | Event 1, 2, 3 (not time-based) | Calendar time doesn't reflect engagement |

## Common mistakes in tour cohort analysis

**Survivorship bias in completion cohorts.** Users who complete a 5-step tour are already more engaged than average. Comparing their retention to non-completers confuses correlation with causation. The fix: compare completers against a control cohort who never saw the tour at all (an A/B hold-back group).

**Ignoring dwell time per step.** Two users complete the same tour. One spent 45 seconds per step. The other clicked through all five steps in 8 seconds. Both are "completers." Add step dwell time to your tour events and split your completer cohort into meaningful-engagement and click-through subgroups.

**Using acquisition cohorts when you need behavioral ones.** Acquisition cohorts are useful for measuring changes to your tour over time. But they're terrible for measuring tour effectiveness because of confounding variables.

## Tools for tour cohort analysis

PostHog stands out for developer teams. It's open-source, self-hostable, and its behavioral cohort builder accepts any event property as a cohort criterion. Amplitude and Mixpanel both support behavioral cohorts with generous free tiers (10M events/month and 100K tracked users/month, respectively).

One honest limitation: Tour Kit doesn't include a built-in analytics dashboard or cohort visualization. It's a tour *library*, not an analytics platform. You bring your own analysis tool.

## FAQ

**What is cohort analysis for product tours?**
Cohort analysis for product tours segments users by tour-related behaviors and compares retention or activation rates across those groups. Chameleon's dataset of 15 million interactions shows trigger type alone creates a 2x completion gap.

**Which cohort type is most useful for measuring tour effectiveness?**
Behavioral cohorts produce the most actionable signal. Group users by what they did during and after the tour: completed and activated, completed but didn't activate, abandoned at step N, or skipped entirely.

**How many steps should a product tour have for best retention?**
Benchmark data shows 4-step tours hit peak completion at 74%, while 5-step tours drop to 34%. Run a cohort analysis to check whether 4-step completers retain better at day 30 before optimizing purely for completion rate.

---

Full article with interactive comparison tables: [usertourkit.com/blog/cohort-analysis-product-tour](https://usertourkit.com/blog/cohort-analysis-product-tour)
