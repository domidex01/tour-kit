---
title: "How to A/B test product tours (complete guide with metrics)"
slug: "ab-test-product-tour"
canonical: https://usertourkit.com/blog/ab-test-product-tour
tags: react, javascript, web-development, testing, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/ab-test-product-tour)*

# How to A/B test product tours (complete guide with metrics)

Most teams measure whether users finish a product tour. That's the wrong metric. A tour someone clicks through just to dismiss it shows 100% completion and zero activation. The real question isn't "did they finish?" but "did they do the thing the tour was supposed to teach them?"

As of April 2026, the median completion rate for a 5-step product tour is 34% ([Product Fruits, 2026](https://productfruits.com/blog/product-tour-metrics/)). But that number means nothing without knowing what happened after. This guide covers how to set up A/B tests that measure actual outcomes, not vanity completion rates.

```bash
npm install @tourkit/core @tourkit/react
```

Tour Kit is our project, and it's what we use in the code examples below. The methodology applies to any tour library or SaaS tool.

## What is A/B testing for product tours?

A/B testing for product tours means showing two or more variants of the same onboarding flow to different user segments, then measuring which variant drives the intended behavior. You run the test until you reach statistical significance at a 95% confidence level, then ship the winner.

## Why most teams measure the wrong thing

Tour completion rate is the default metric in every onboarding analytics dashboard. And it's the wrong primary metric for A/B tests. A tour that auto-advances on a timer will show higher completion than one that waits for user interaction. Neither signal tells you whether the user learned anything.

The primary metric should be the **downstream activation event**: the action the tour was designed to teach. If your tour teaches dashboard creation, measure "created first dashboard within 24 hours."

## Setting up your first product tour A/B test

### 1. Establish the baseline
Run your current tour unchanged for two weeks. Measure activation event rate.

### 2. Form a hypothesis
"Replacing the 7-step linear tour with a 3-step contextual tour will increase first-dashboard creation from 28% to 35% within 48 hours."

### 3. Calculate sample size
For 500 DAU, 28% baseline, 7-point lift target: ~380 users per variant, ~11 days.

### 4. Implement with feature flags

```tsx
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

### 5. Don't peek
Checking results daily inflates your false-positive rate from 5% to 30%.

## Common mistakes

1. Testing too many variables at once
2. No sticky bucketing (users see different variants across sessions)
3. Running during anomalous periods (launches, holidays)
4. Ignoring the novelty effect (run at least 2 weeks)
5. Optimizing for completion when activation is flat

## Tools

| Tool | React SDK | Free tier |
|------|-----------|-----------|
| PostHog | Yes | 1M events/month |
| GrowthBook | Yes | Open source |
| LaunchDarkly | Yes | No |
| Statsig | Yes | Limited |

---

Full article with React SPA patterns, sample size calculations, and accessibility compliance: [usertourkit.com/blog/ab-test-product-tour](https://usertourkit.com/blog/ab-test-product-tour)
