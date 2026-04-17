---
title: "Cohort analysis for product tours: finding what works"
slug: "cohort-analysis-product-tour"
canonical: https://usertourkit.com/blog/cohort-analysis-product-tour
tags: react, javascript, web-development, analytics, saas
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

Cohort analysis for product tours groups users by shared tour-related behaviors (when they signed up, which tour variant they saw, how they triggered it, which step they reached) then compares retention, activation, or conversion rates across those groups over time. As of April 2026, Chameleon's benchmark dataset of 15 million tour interactions shows that trigger type alone creates a 2x gap in completion rates ([Chameleon, 2025](https://www.chameleon.io/blog/product-tour-benchmarks-highlights)), yet most teams never segment their tour data by trigger method.

## Why tour completion rate alone misleads you

The average product tour completion rate sits at 61%, based on Chameleon's analysis of 15 million interactions. Sounds healthy. But the median SaaS app loses 75% of its daily active users within the first week ([Mixpanel, 2022 Product Benchmarks](https://mixpanel.com/blog/product-benchmarks/)). If your tour completers churn at nearly the same rate as non-completers, the tour isn't doing its job.

Here's what happened at Slack. Their growth team identified that teams sending 2,000+ messages retained at dramatically higher rates. They rebuilt onboarding to push new teams toward that behavior faster. Result: 30-day retention for new teams jumped 17%. The insight came from behavioral cohort analysis.

## The four cohort types that matter

### Acquisition cohorts
Group users by signup week or month, then compare tour completion rates across cohorts. This catches seasonal effects and the impact of tour changes over time.

### Behavioral cohorts
The most powerful split. Group users by what they *did* during or after the tour: completed and activated, completed but didn't activate, abandoned at step 3, or skipped entirely. Then run retention curves for each group at day 7, 14, and 30.

### Trigger-type cohorts
Chameleon's benchmark data shows stark differences by how a tour starts:

| Trigger type | Completion rate |
|---|---|
| Click-triggered (user initiates) | 67% |
| Launcher-driven | 67% |
| Checklist-triggered | +21% vs baseline |
| Auto-popup (set delay) | 31% |

### Tour-length cohorts
- 3-step tours: 72% completion
- 4-step tours: 74% completion (the sweet spot)
- 5-step tours: 34% completion
- 7+ step tours: 16% completion

## Piping tour events into cohort analysis

```tsx
// src/components/TrackedTour.tsx
import { TourProvider } from '@tourkit/react';
import { useAnalytics } from '@tourkit/analytics';

function OnboardingTour() {
  const analytics = useAnalytics();

  return (
    <TourProvider
      tourId="onboarding-v3"
      steps={tourSteps}
      onStepChange={(step) => {
        analytics.track('tour_step_viewed', {
          tour_id: 'onboarding-v3',
          step_id: step.id,
          trigger_type: 'checklist',
        });
      }}
      onComplete={() => {
        analytics.track('tour_completed', {
          tour_id: 'onboarding-v3',
          total_steps: tourSteps.length,
        });
      }}
    />
  );
}
```

The key properties: `tour_id`, `step_id`, `trigger_type`, and `dismissed_at_step`. These become your cohort dimensions.

## Common mistakes

1. **Survivorship bias** — Compare completers against a hold-back group, not against non-completers
2. **Ignoring dwell time** — Split completers by time spent per step
3. **Wrong cohort type** — Use behavioral cohorts for effectiveness, acquisition cohorts for change tracking

## Tools for tour cohort analysis

PostHog, Amplitude, and Mixpanel all support behavioral cohorts. PostHog is open-source with a 1M events/month free tier. Tour Kit's analytics package handles event emission and plugin routing.

---

Full article with interactive tables, code examples, and cohort window selection guide: [usertourkit.com/blog/cohort-analysis-product-tour](https://usertourkit.com/blog/cohort-analysis-product-tour)
