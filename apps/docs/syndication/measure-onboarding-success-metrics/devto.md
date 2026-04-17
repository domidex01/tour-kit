---
title: "10 Onboarding Metrics That Actually Predict Retention (With Benchmarks)"
published: false
description: "We pulled benchmark data from 15M product tour interactions and 547 SaaS companies. Here are the 10 metrics that matter, with formulas and React instrumentation code."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/measure-onboarding-success-metrics
cover_image: https://usertourkit.com/og-images/measure-onboarding-success-metrics.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/measure-onboarding-success-metrics)*

# How to measure onboarding success: 10 metrics that matter

Most SaaS teams track signups and churn. The gap between those two numbers is where onboarding lives, and most teams have no visibility into it. As of April 2026, 59% of SaaS buyers regret at least one software purchase made in the past 18 months ([Gartner 2025 Software Buying Trends](https://www.gartner.com/en/digital-markets/insights/software-buying-trends)). Most of that regret crystallizes in the first 30 days, during onboarding.

This guide covers the 10 metrics that actually predict whether your onboarding works. Each one includes the formula, benchmark data from real studies, and how to instrument it in a React app using Tour Kit's analytics hooks.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What are onboarding success metrics?

Onboarding success metrics are quantitative measurements that track how effectively new users progress from signup to their first meaningful outcome in your product. Unlike vanity metrics such as page views or session duration, onboarding metrics connect user behavior during the first 7-30 days to long-term retention and revenue. A study of 547 SaaS companies found the average time to value is 1 day, 12 hours, and 23 minutes, but that number varies wildly by industry ([Userpilot 2024 TTV Benchmark Report](https://userpilot.com/blog/time-to-value-benchmark-report-2024/)).

## Why onboarding metrics matter more than you think

Companies with structured onboarding see 62% faster time-to-productivity, and teams that instrument their onboarding funnel can identify the exact step where users drop off, rather than guessing from aggregate churn numbers. That gap between "we think onboarding is fine" and "we know step 3 loses 40% of users" is where metrics earn their keep.

As the Appcues team puts it: "Progress will be slow, and you're likely to do more damage than good" without metrics to guide your iterations ([Appcues Blog](https://www.appcues.com/blog/user-onboarding-metrics-and-kpis)). The data backs this up. Litmus saw a 2,100% increase in feature adoption after instrumenting their onboarding flow. Yotpo improved retention by 50%. Take.net boosted activation rate by 124%.

These aren't outliers. They're what happens when teams stop guessing.

## Benchmarks: the 10 metrics at a glance

| Metric | Formula | Benchmark | Source |
|--------|---------|-----------|--------|
| Tour completion rate | Completions / Tour starts x 100 | 61% average | Chameleon (15M interactions) |
| Time to value | Date(first value action) - Date(signup) | 1d 12h 23m average | Userpilot (547 companies) |
| Activation rate | Activated users / Onboarding cohort x 100 | Varies (define per product) | Appcues |
| Feature adoption rate | Feature users / Eligible users x 100 | Varies (define per feature) | Userpilot |
| Onboarding funnel drop-off | Users lost at step / Users entering step x 100 | 38% at stage 1 to 2 | UXCam |
| 30-day retention rate | Users at day 30 / Initial cohort x 100 | 40-60% (B2B) | AmraAndElma |
| Free trial conversion | Converters / Trial users x 100 | 17% average | UXCam |
| Customer effort score | Average score on 1-7 scale | Below 3 is excellent | CustomerGauge |
| Onboarding NPS | % Promoters - % Detractors | 30-40 (B2B SaaS median) | Retently |
| Support ticket volume | Tickets in first 14 days / New users | Lower is better; track trend | Internal |

## 1. Tour completion rate

Tour completion rate measures what percentage of users who start a product tour actually finish it. Across 15 million interactions analyzed by Chameleon, the average sits at 61%, but step count has a massive effect: 3-step tours hit 72%, 4-step tours peak at 74%, and 7+ step tours collapse to 16% ([Chameleon benchmarks](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)).

The counterintuitive finding: 4 steps outperforms 3. A tour that's too short doesn't deliver enough value to feel worthwhile.

**How to track it with Tour Kit:**

```tsx
// src/components/OnboardingTour.tsx
import { useTour } from '@tourkit/react';
import { useAnalytics } from '@tourkit/analytics';

function OnboardingTour() {
  const analytics = useAnalytics();

  const tour = useTour({
    tourId: 'onboarding-main',
    steps: [
      { target: '#create-project', content: 'Start here' },
      { target: '#invite-team', content: 'Add your team' },
      { target: '#first-report', content: 'Run your first report' },
      { target: '#dashboard', content: 'Your metrics live here' },
    ],
    onComplete: () => {
      analytics.track('tour_completed', { tourId: 'onboarding-main' });
    },
    onStepChange: (step) => {
      analytics.track('tour_step_viewed', {
        tourId: 'onboarding-main',
        stepIndex: step.index,
      });
    },
    onDismiss: (step) => {
      analytics.track('tour_dismissed', {
        tourId: 'onboarding-main',
        dismissedAt: step.index,
      });
    },
  });

  return <>{tour.currentStep && tour.render()}</>;
}
```

One more thing from the Chameleon data: self-serve tours (user-initiated via hotspot or button) complete at 123% higher rates than auto-triggered tours. User agency matters.

## 2. Time to value

Time to value is the duration between a user's signup and their first meaningful action inside your product. Across 547 SaaS companies, the average TTV is 1 day, 12 hours, and 23 minutes. But industry matters enormously: CRM tools average 1 day 4 hours, while HR platforms take 3 days and 18 hours ([Userpilot TTV Benchmark](https://userpilot.com/blog/time-to-value-benchmark-report-2024/)).

Here's a finding that challenges conventional wisdom: sales-led growth companies (1d 11h) achieved slightly faster TTV than product-led growth companies (1d 12h). PLG's reputation for rapid activation doesn't always hold up in the data.

**How to calculate:** `Date(first value action) - Date(signup)`

The hard part is defining "first value action." For a project management tool, that might be "created first task." For an analytics platform, "viewed first dashboard." Pick the moment your user would say "oh, this is useful" and track backward from there.

## 3. Activation rate

Activation rate measures the percentage of new users who reach a specific "aha moment" milestone within a set time window, typically the first 7 or 14 days after signup. There is no universal benchmark because every product defines activation differently.

The formula is straightforward: `Activated Users / Onboarding Cohort x 100`. The difficulty is choosing the right activation event.

Start by looking at your retained users. What actions did they take in their first session that churned users didn't? That behavioral gap is your activation event. Take.net identified theirs and saw a 124% increase in activation rate after optimizing the path to it.

## 4. Feature adoption rate

Feature adoption rate tracks how many eligible users actively use a specific feature. The formula: `Feature Users / Eligible Users x 100`. The denominator matters. Don't divide by total users when a feature is only available to admins or premium users.

```tsx
// src/hooks/useFeatureAdoption.tsx
import { useAdoption } from '@tourkit/adoption';

function DashboardPage() {
  const { trackFeatureUsed, adoptionRate } = useAdoption({
    featureId: 'advanced-filters',
    eligibleUsers: 'premium',
  });

  return (
    <FilterPanel
      onApply={(filters) => {
        trackFeatureUsed();
        applyFilters(filters);
      }}
    />
  );
}
```

Litmus tracked feature adoption this way and saw a 2,100% increase after adding contextual hints that nudged users toward underused features.

## 5. Onboarding funnel drop-off rate

Funnel drop-off rate measures where users abandon your onboarding sequence. The industry average for the first step transition (stage 1 to stage 2) is roughly 38% ([UXCam](https://uxcam.com/blog/drop-off-rates/)). That means more than a third of users who start onboarding don't make it past the second screen.

Track this per-step, not as a single number. A tour with 60% overall completion might have a 40% drop at step 3 and near-zero drop everywhere else. That tells you exactly where to focus.

## 6. 30-day retention rate

30-day retention is the percentage of users who return to your product 30 days after signup. Good B2B SaaS retention sits between 40-60%. Good B2C rates range from 30-50%.

The connection to onboarding is direct: users who complete onboarding flows retain at significantly higher rates. Yotpo proved this with a 50% retention improvement after restructuring their onboarding sequence.

## 7. Free trial conversion rate

Free trial conversion tracks how many trial users become paying customers. The industry average hovers around 17%, but context matters. B2B products with credit card upfront see higher conversion (around 40-60%) while opt-in trials convert at lower rates.

## 8. Customer effort score

Customer effort score (CES) measures how much work a user had to put in during onboarding, rated on a 1-7 scale. Scores below 3 indicate low friction. Above 5 means your onboarding is fighting the user.

```tsx
// src/components/PostOnboardingSurvey.tsx
import { useSurvey } from '@tourkit/surveys';

function PostOnboardingSurvey() {
  const survey = useSurvey({
    type: 'ces',
    trigger: 'tour_completed',
    question: 'How easy was it to set up your first project?',
    scale: { min: 1, max: 7 },
  });

  return survey.isVisible ? survey.render() : null;
}
```

Fire this immediately after onboarding completion. The response rate drops by 60% if you wait even 24 hours.

## 9. Onboarding NPS

Net Promoter Score measured specifically after onboarding captures user sentiment at the most impressionable moment. B2B SaaS median NPS sits between 30-40.

Don't combine onboarding NPS with your product-wide NPS. Measure them separately. A user might hate your onboarding (NPS of -10) but love the product once they figure it out (NPS of 60). That gap is actionable.

## 10. Support ticket volume (first 14 days)

Track how many support tickets new users file in their first 14 days. There's no universal benchmark here. What matters is the trend: are tickets per new user going up or down over time?

A spike in onboarding-related tickets after a product change tells you the change broke the getting-started experience. A steady decline after you add a product tour tells you the tour is working.

## Building your metrics dashboard

Start with three core measurements:

1. **Tour completion rate** (are users finishing what you built?)
2. **Time to value** (how fast do they get there?)
3. **30-day retention** (do they stick around?)

These three form a funnel: completion feeds activation, activation feeds retention. Once you have baseline numbers, add metrics 4-10 based on where the funnel leaks.

Tour Kit's analytics plugin pipes all tour events to whatever analytics provider you already use. Check out our [PostHog integration guide](https://usertourkit.com/blog/track-product-tour-completion-posthog-events) and [Mixpanel funnel setup](https://usertourkit.com/blog/mixpanel-product-tour-funnel) for specific implementations.

## Common measurement mistakes

**Optimizing for completion rate alone.** A tour with 95% completion that doesn't improve retention is a well-executed waste of time.

**Using total users as the denominator.** When measuring feature adoption, only count users who can access the feature.

**Measuring too late.** CES and NPS surveys lose signal fast. Capture effort scores within minutes of onboarding, not days later.

**Ignoring trigger type.** Chameleon's data shows checklist-triggered tours outperform time-delayed tours by 21%. How you start the tour matters as much as what's in it.

## FAQ

### What is a good tour completion rate for SaaS products?

The average tour completion rate across 15 million interactions is 61%, according to Chameleon's benchmark study. Tours with 3-4 steps hit 72-74%, while tours with 7+ steps drop to 16%. Keep tours under 5 steps and use progress indicators, which reduce dismissal rates by 20%.

### How do you calculate time to value for onboarding?

Time to value equals the timestamp of a user's first meaningful product action minus their signup timestamp. Across 547 SaaS companies, the average TTV is 1 day, 12 hours, and 23 minutes. Define "meaningful action" as the moment your user gets their first real outcome.

### Which onboarding metrics should I track first?

Start with three metrics: tour completion rate, time to value, and 30-day retention. These three form a funnel that reveals where your onboarding leaks. Add feature adoption rate and CES once you have baselines.
