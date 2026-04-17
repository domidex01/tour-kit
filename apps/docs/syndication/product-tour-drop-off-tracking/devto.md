---
title: "Your product tour has a 39% failure rate. Here's how to find out why."
published: false
description: "The average product tour completion rate is 61%. Step-level drop-off tracking tells you exactly which step kills momentum. Here's how to build it with React."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/product-tour-drop-off-tracking
cover_image: https://usertourkit.com/og-images/product-tour-drop-off-tracking.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-drop-off-tracking)*

# How to track product tour drop-off points

You built a 7-step product tour. Users start it. But something between step 3 and step 4 kills momentum, and you have no idea what. Without step-level tracking, your tour analytics are a black box: you know the completion rate, but not *where* users bail.

Most product tour libraries fire a single `tour_completed` event and call it a day. That tells you nothing about the 39% of users who started but never finished. The average product tour completion rate is just 61%, according to [Chameleon's analysis of 15 million tour interactions](https://www.chameleon.io/blog/product-tour-benchmarks-highlights). The fix isn't more events. It's the right events at the right granularity, piped into a funnel your team can actually read.

This tutorial walks through building step-level drop-off tracking with Tour Kit's `@tour-kit/analytics` package. You'll wire up `step_viewed`, `step_completed`, and `tour_abandoned` events, then visualize the funnel in PostHog or Mixpanel.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## The 4-to-5 step cliff

Chameleon's benchmark data across 550 million tour interactions shows a striking pattern: 4-step tours average 74% completion, but 5-step tours crater to 34%. That single extra step cuts your completion rate in half.

| Tour Length | Completion Rate |
|---|---|
| 3 steps | 72% |
| 4 steps | 74% |
| 5 steps | 34% |
| 7+ steps | 16% |

Without step-level drop-off data, you'd never know whether to shorten your tour or fix a specific step's content.

## The formula

```
Step drop-off rate = ((Users at step N - Users at step N+1) / Users at step N) x 100
```

A 5-step tour with 1,000 starters and 340 completions has a 66% cumulative drop-off rate. But that number is useless without knowing whether the loss happens at step 2 (bad targeting) or step 4 (confusing content).

## Setting up the analytics provider

Tour Kit's `@tour-kit/analytics` package provides a plugin-based tracker. Start by wrapping your app with the provider:

```tsx
// src/providers/TourAnalytics.tsx
import { AnalyticsProvider } from '@tourkit/analytics'
import { PostHogPlugin } from '@tourkit/analytics/plugins/posthog'

const plugins = [
  PostHogPlugin({
    client: typeof window !== 'undefined' ? window.posthog : undefined,
  }),
]

export function TourAnalyticsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider plugins={plugins}>
      {children}
    </AnalyticsProvider>
  )
}
```

## Instrumenting your tour

Wire up `onStepChange`, `onComplete`, and `onSkip` to the analytics tracker:

```tsx
// src/tours/OnboardingTour.tsx
import { useTour } from '@tourkit/react'
import { useAnalytics } from '@tourkit/analytics'

export function OnboardingTour() {
  const analytics = useAnalytics()

  const tour = useTour({
    tourId: 'onboarding-v2',
    steps: [
      { id: 'welcome', target: '#welcome-banner', content: 'Welcome to Acme!' },
      { id: 'create-project', target: '#new-project-btn', content: 'Start by creating a project.' },
      { id: 'invite-team', target: '#invite-btn', content: 'Invite your teammates.' },
      { id: 'run-test', target: '#run-test-btn', content: 'Run your first test.' },
      { id: 'dashboard', target: '#dashboard-link', content: 'Check your results here.' },
    ],
    onStepChange: (step, index, context) => {
      analytics.stepViewed('onboarding-v2', step.id, index, context.tour.steps.length)
    },
    onComplete: () => {
      analytics.tourCompleted('onboarding-v2')
    },
    onSkip: (context) => {
      analytics.tourSkipped('onboarding-v2', context.currentStepIndex, context.tour.steps[context.currentStepIndex]?.id)
    },
  })

  return <>{tour.component}</>
}
```

The distinction between `tour_skipped` and `tour_abandoned` matters. A skip is intentional (user clicked a button). Abandonment happens when the user navigates away or the tour element disappears. Tour Kit detects abandonment via `beforeunload` and `MutationObserver` automatically.

## Adding time-on-step tracking

Tour Kit records `duration` automatically, but you can enrich with custom metadata using a dedicated hook:

```tsx
// src/hooks/useDropOffTracking.ts
import { useCallback, useRef } from 'react'
import { useAnalytics } from '@tourkit/analytics'

export function useDropOffTracking(tourId: string) {
  const analytics = useAnalytics()
  const stepTimers = useRef<Map<string, number>>(new Map())

  const onStepEnter = useCallback(
    (stepId: string, stepIndex: number, totalSteps: number) => {
      stepTimers.current.set(stepId, Date.now())
      analytics.stepViewed(tourId, stepId, stepIndex, totalSteps, {
        enteredAt: new Date().toISOString(),
        percentComplete: Math.round((stepIndex / totalSteps) * 100),
      })
    },
    [analytics, tourId]
  )

  const onStepExit = useCallback(
    (stepId: string, stepIndex: number, totalSteps: number) => {
      const enterTime = stepTimers.current.get(stepId)
      const timeOnStep = enterTime ? Date.now() - enterTime : 0
      analytics.stepCompleted(tourId, stepId, stepIndex, totalSteps, {
        timeOnStepMs: timeOnStep,
        timeOnStepSeconds: Math.round(timeOnStep / 1000),
      })
      stepTimers.current.delete(stepId)
    },
    [analytics, tourId]
  )

  return { onStepEnter, onStepExit }
}
```

## Benchmarks

Based on Chameleon's published data and Userpilot's onboarding research:

| Metric | Needs work | Acceptable | Strong |
|---|---|---|---|
| Overall completion | Below 40% | 40-65% | Above 65% |
| Per-step drop-off | Above 30% | 15-30% | Below 15% |
| First-step abandonment | Above 25% | 10-25% | Below 10% |
| Avg time-on-step | Over 20s or under 1s | 3-12s | 5-8s |

## 5 quick wins

1. **Shorten your tour.** Split 5+ step tours into a primary (3-4 steps) and secondary flow.
2. **Move social actions later.** "Invite your team" steps show the highest drop-off consistently.
3. **Add progress indicators.** A visible step counter boosts completion by 12%.
4. **Switch from delay triggers to click triggers.** Self-serve tours complete at 67% vs 31% for auto-triggered.
5. **Fix the content, not the format.** High time-on-step + high drop-off = confusing content.

---

Full article with PostHog/Mixpanel funnel setup, custom alert plugin code, and FAQ: [usertourkit.com/blog/product-tour-drop-off-tracking](https://usertourkit.com/blog/product-tour-drop-off-tracking)
