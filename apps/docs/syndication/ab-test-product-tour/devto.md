---
title: "Stop measuring tour completion rate — here's what to A/B test instead"
published: false
description: "The median product tour completion rate is 34%. But completion is the wrong metric. Here's how to set up A/B tests that measure activation, with feature flag implementation and sample size calculations for SaaS apps."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/ab-test-product-tour
cover_image: https://usertourkit.com/og-images/ab-test-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ab-test-product-tour)*

# How to A/B test product tours (complete guide with metrics)

Most teams measure whether users finish a product tour. That's the wrong metric. A tour someone clicks through just to dismiss it shows 100% completion and zero activation. The real question isn't "did they finish?" but "did they do the thing the tour was supposed to teach them?"

As of April 2026, the median completion rate for a 5-step product tour is 34% ([Product Fruits, 2026](https://productfruits.com/blog/product-tour-metrics/)). But that number means nothing without knowing what happened after. This guide covers how to set up A/B tests that measure actual outcomes, not vanity completion rates.

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit is our project, and it's what we use in the code examples below. The methodology applies to any tour library or SaaS tool. The principles don't change based on your stack.

## What is A/B testing for product tours?

A/B testing for product tours means showing two or more variants of the same onboarding flow to different user segments, then measuring which variant drives the intended behavior. One group sees variant A (the control, your current tour) while the other sees variant B (the experiment, a modified version). You run the test until you reach statistical significance at a 95% confidence level, then ship the winner.

The concept is straightforward. The execution is where teams go wrong.

## Why A/B testing product tours matters for activation

Teams that ship product tours without testing them are guessing. According to the 2026 State of Customer Onboarding report, 57% of leaders say onboarding friction directly impacts revenue realization ([OnRamp, 2026](https://onramp.us/blog/2026-state-of-onboarding-report)). A tour that confuses users instead of activating them doesn't just fail silently; it actively pushes new signups toward churn.

Product Fruits found that removing friction from onboarding flows improved completion by 22%, while issue-based fixes reduced churn by 18%. Those numbers come from companies that tested.

## Why most teams measure the wrong thing

Tour completion rate is the default metric in every onboarding analytics dashboard. Appcues shows it. Pendo shows it. UserGuiding shows it. And it's the wrong primary metric for A/B tests.

Here's why. A tour that auto-advances on a timer will show higher completion than one that waits for user interaction. A tour with a prominent "Skip" button will show lower completion than one that buries the dismiss option. Neither of those signals tells you whether the user learned anything.

Milan, a DAP expert with experience across WalkMe, Pendo, and Appcues, put it directly on the Intercom community forum: "there is no single answer, not even a range of % of completion you should expect" ([Intercom Community, 2026](https://community.intercom.com/product-tours-10/what-is-the-industry-standard-completion-goal-rate-for-product-tours-299)).

## Choosing primary and secondary metrics

The primary metric for any product tour A/B test should be the downstream activation event, meaning the action the tour was designed to teach. If your tour walks users through creating their first dashboard, the primary metric is "created first dashboard within 24 hours." Not "finished tour."

| Metric | Type | What it tells you | Watch out for |
|--------|------|-------------------|---------------|
| Activation event rate | Primary | Did the tour teach the intended behavior? | Set a time window (24h, 48h, 7d) and stick to it |
| Tour completion rate | Secondary | Did users reach the final step? | High completion + low activation = bad tour |
| Step drop-off rate | Secondary | Where do users abandon? | Some drop-off is healthy |
| Time to activation | Secondary | Does the tour speed up the path? | Faster isn't always better; comprehension matters |
| Support ticket volume | Secondary | Did the tour reduce confusion? | Lag indicator; needs 2-4 weeks of data |

## Setting up your first product tour A/B test

### 1. Establish the baseline

Run your current tour unchanged for at least two weeks. Measure the activation event rate (not completion) for users who saw the tour.

### 2. Form a hypothesis

"Replacing the 7-step linear tour with a 3-step contextual tour will increase first-dashboard creation from 28% to 35% within 48 hours."

### 3. Calculate sample size

For a B2B SaaS app with 500 DAU, baseline activation of 28%, and a target 7-point lift:

| Parameter | Value |
|-----------|-------|
| Baseline conversion | 28% |
| Minimum detectable effect | 7 percentage points |
| Confidence level | 95% |
| Statistical power | 80% |
| Required sample per variant | ~380 users |
| Total users needed | ~760 |
| Estimated test duration (500 DAU) | ~11 days |

### 4. Implement with feature flags

```tsx
// src/components/OnboardingTour.tsx
import { useTour } from '@tourkit/react';
import { useFeatureFlag } from './your-flag-provider';

export function OnboardingTour() {
  const variant = useFeatureFlag('onboarding-tour-experiment');

  const controlSteps = [
    { target: '#sidebar-nav', content: 'Start by exploring the sidebar navigation.' },
    { target: '#create-btn', content: 'Click here to create your first dashboard.' },
    { target: '#template-picker', content: 'Pick a template to get started quickly.' },
    { target: '#widget-panel', content: 'Drag widgets from this panel.' },
    { target: '#save-btn', content: 'Save your dashboard when you are done.' },
  ];

  const shortSteps = [
    { target: '#create-btn', content: 'Create your first dashboard in under a minute.' },
    { target: '#template-picker', content: 'Templates handle the layout. Pick one.' },
    { target: '#save-btn', content: 'Hit save. You can always edit later.' },
  ];

  const steps = variant === 'short-contextual' ? shortSteps : controlSteps;

  const tour = useTour({
    tourId: `onboarding-${variant ?? 'control'}`,
    steps,
    onComplete: () => {
      trackEvent('tour_completed', { variant: variant ?? 'control' });
    },
  });

  return <>{tour.render()}</>;
}
```

### 5. Run, wait, and don't peek

Checking results daily and stopping early inflates your false-positive rate from 5% to as high as 30%. Set the duration upfront and commit to it.

## Common mistakes that invalidate results

**Testing too many things at once.** Change one variable per test.

**Not accounting for new vs. returning users.** Use sticky bucketing so users stay in the same variant permanently.

**Running tests during anomalous periods.** Product launches and holidays skew onboarding traffic.

**Ignoring the novelty effect.** Run tests for at least two full weeks to let novelty wear off.

**Optimizing for completion when activation is flat.** If variant B shows 50% completion but activation rates are identical, variant B didn't win.

## Tools for running product tour A/B tests

| Tool | React SDK | Sticky bucketing | Statistical engine | Free tier |
|------|-----------|------------------|-------------------|-----------|
| PostHog | Yes | Yes | Bayesian | 1M events/month |
| GrowthBook | Yes | Yes | Frequentist + Bayesian | Open source (self-host) |
| LaunchDarkly | Yes | Yes | Frequentist | No ($8.33/seat/month) |
| Statsig | Yes | Yes | Bayesian | Yes (limited) |

---

Full article with code examples for React SPA patterns and accessibility compliance: [usertourkit.com/blog/ab-test-product-tour](https://usertourkit.com/blog/ab-test-product-tour)
