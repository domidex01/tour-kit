---
title: "Onboarding funnel analysis in React: what to measure and how to wire it"
published: false
description: "Most onboarding funnels track completion rate and miss the metric that actually predicts retention: activation quality. Here's how to instrument step-level funnel events in React with real code."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/funnel-analysis-onboarding-flows
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/funnel-analysis-onboarding-flows)*

# Funnel analysis for onboarding flows: a developer's guide

Most onboarding funnels measure the wrong thing. They track whether users *finished* the flow and call it a day. But completion rate and activation quality are different metrics, and conflating them hides the exact problems that cause churn. This guide covers how to instrument onboarding funnels in React, which metrics actually predict retention, and where the standard tooling leaves gaps you need to fill yourself.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

Tour Kit's analytics hooks give you step-level event data out of the box. We'll wire them into real funnel tracking below.

## What is funnel analysis for onboarding?

Funnel analysis for onboarding is a measurement approach that maps each step a new user takes from signup to first value, then calculates the conversion rate between adjacent steps to identify where users drop off. Unlike path analysis, which captures the varied routes users actually take through your app, funnel analysis treats the journey as a linear sequence with compounding dropout at each stage. As of April 2026, SaaS companies lose 30-50% of new users during onboarding alone ([Amplitude](https://amplitude.com/guides/measure-user-onboarding)), making this the single most impactful measurement point in most products.

The distinction between funnels and paths matters for React developers building product tours. Your tour steps create an ordered sequence by design. That's a funnel. But user behavior within and between those steps follows non-linear paths. You need both views.

## Why funnel analysis onboarding metrics matter more than completion rate

A user who clicks "Next" through every tooltip in your onboarding tour has a 100% completion rate. A user who skips the tour, opens the dashboard, creates their first project, and invites a teammate has a 0% completion rate. Which one churns?

The second user activated. The first one didn't.

As of April 2026, average SaaS activation rates sit at 37.5% ([Growth Labs Benchmarks](https://agilegrowthlabs.com/blog/user-activation-rate-benchmarks-2025/)). Companies that increase activation by 25% see a corresponding 34% revenue bump. Completion rate tells you whether the tour played. Activation rate tells you whether the user got value.

The practical implication: instrument your funnel to track both. Measure tour completion *and* the downstream action that signals activation. If completion is high but activation is flat, your tour is showing the wrong things.

## The five stages of an onboarding funnel

Every onboarding funnel follows the same skeleton, regardless of product complexity: signup, activation, habit formation, retention, and expansion. When we instrumented Tour Kit's own demo app with step-level tracking, we found that the stage boundaries map cleanly to specific events you can capture in React callbacks.

### Signup to activation

This is where 79% of funnel drop-off happens ([parallelhq.com](https://www.parallelhq.com/blog/what-funnel-analysis)). The user has created an account but hasn't done anything meaningful yet. Your product tour typically lives here. The metric that matters is time-to-value (TTV): how many minutes until the user completes the core action your product exists for. Products that get TTV under 5 minutes convert free trials above 25% ([Chameleon](https://www.chameleon.io/blog/user-onboarding-metrics)).

### Activation to habit

The user did the thing once. Now they need to do it again. Day-7 retention above 40% signals this transition is working. Below 30% means users activated but didn't stick.

### Habit to retention

Measured at 30 and 90 days. This is a lagging indicator. By the time retention data arrives, the onboarding window is long closed. But it validates whether your funnel changes actually worked.

### Retention to expansion

Upsells, team invites, feature upgrades. Proactive onboarding here drives 20-40% increases in expansion revenue ([SaaS Hero](https://www.saashero.net/customer-retention/b2b-saas-conversion-benchmarks-journey/)).

### The metrics taxonomy

Not all funnel metrics carry equal weight. Here's how to classify them:

| Metric | Type | What it predicts |
|--------|------|-----------------|
| Tour completion rate | Leading | Whether users see your activation prompt |
| Time to value (TTV) | Leading | Trial-to-paid conversion |
| Activation rate | Leading | Day-7 retention |
| Step conversion rate | Leading | Where to improve next |
| Day-30 retention | Lagging | Product-market fit signal |
| Churn rate | Lagging | Onboarding quality outcome |
| Free-to-paid conversion | Lagging | Revenue impact of onboarding |

Leading indicators tell you what to fix now. Lagging indicators tell you if the fix worked. Track both, act on the leading ones.

## Instrumenting funnel events in React with Tour Kit

Most analytics guides tell you to "track onboarding events" without showing the actual code. Here's the concrete wiring, tested in a Vite 6 + React 19 project with PostHog as the analytics provider. Tour Kit's `onStepChange` and `onComplete` callbacks feed directly into your analytics provider. This example uses PostHog, but the pattern works with Amplitude, GA4, or any event-based tool.

```tsx
// src/components/OnboardingTour.tsx
import { TourProvider, useTour } from '@tourkit/react';
import posthog from 'posthog-js';

const steps = [
  { id: 'welcome', target: '#header', content: 'Welcome to the dashboard' },
  { id: 'create-project', target: '#new-project-btn', content: 'Create your first project' },
  { id: 'invite-team', target: '#invite-btn', content: 'Invite your team' },
];

function OnboardingTour() {
  return (
    <TourProvider
      steps={steps}
      onStepChange={(step, prevStep) => {
        posthog.capture('onboarding_step_viewed', {
          step_id: step.id,
          step_index: steps.indexOf(step),
          prev_step_id: prevStep?.id ?? null,
          timestamp: Date.now(),
        });
      }}
      onComplete={() => {
        posthog.capture('onboarding_tour_completed', {
          total_steps: steps.length,
          timestamp: Date.now(),
        });
      }}
      onDismiss={(step) => {
        posthog.capture('onboarding_tour_dismissed', {
          dismissed_at_step: step.id,
          steps_completed: steps.indexOf(step),
          steps_remaining: steps.length - steps.indexOf(step),
        });
      }}
    >
      {/* Tour UI components */}
    </TourProvider>
  );
}
```

The `dismissed_at_step` event is the one most developers forget. It's the most valuable event in your funnel because it tells you *exactly* where users give up. If 40% of dismissals happen on step 3, that step has a content or targeting problem.

## Reading the funnel: where users actually drop off

Once you have step-level data flowing, build a funnel chart in your analytics tool and look for three patterns that appear in nearly every onboarding funnel we've measured: the top-of-funnel cliff, the mid-funnel stall, and the activation-to-habit gap.

### The top-of-funnel cliff

The biggest drop happens between signup and the first meaningful action. For B2B SaaS, the steepest cliff often sits at role-based branching, those screens that ask users to self-classify before they've seen the product. As one practitioner puts it: "Instrument every step. Measure drop-off between each screen. Then ask one question: Does the user need to see this before they can experience value? If the answer is no, remove it or defer it" ([parallelhq.com](https://www.parallelhq.com/blog/what-funnel-analysis)).

### The mid-funnel stall

Users get through the initial tour but stall before completing the activation action. This usually means your tour showed them *features* instead of guiding them to *do the thing*. Smashing Magazine's research on mobile onboarding found that "the trick with onboarding is to show just what users need to know to get started, nothing more, nothing less" ([Smashing Magazine](https://www.smashingmagazine.com/2014/11/refining-your-mobile-onboarding-experience-using-visual-analytics/)).

### The activation-to-habit gap

Users activate once but don't return. This is a product problem, not a tour problem. But your funnel data will surface it. If Day-7 retention is below 30% despite healthy activation, your onboarding is working and your product needs attention elsewhere.

## Activation benchmarks by industry

Activation benchmarks vary wildly across industries, and using a generic "37.5% average" as your target can send you chasing the wrong improvements.

| Industry | Activation rate | Good TTV target | Trial-to-paid benchmark |
|----------|----------------|-----------------|------------------------|
| AI / Machine Learning tools | 54.8% | <5 minutes | 15-25% |
| B2B SaaS (average) | 37.5% | <15 minutes | 8-12% |
| FinTech | 5% | <30 minutes | 3-7% |
| Freemium (all categories) | 25-35% | <10 minutes | 3-7% (top: 15%) |

Sources: [Growth Labs Benchmarks](https://agilegrowthlabs.com/blog/user-activation-rate-benchmarks-2025/), [Chameleon](https://www.chameleon.io/blog/user-onboarding-metrics), [UXCam](https://uxcam.com/blog/drop-off-rates/)

Use these as starting context, not targets. Your own historical data matters more after the first month of measurement.

## The accessibility measurement gap

Here's a blind spot that every other funnel analysis guide ignores. Analytics tools cannot determine whether a user is navigating with a screen reader. Google Analytics has no plans to add this capability, and the Bureau of Internet Accessibility explains why: tracking assistive technology usage is a privacy concern by design ([BOIA](https://www.boia.org/blog/analytics-tools-cant-track-screen-readers-and-shouldnt)).

This means your funnel data is structurally incomplete. You're measuring conversion rates only for users who could complete the flow without assistive technology. If your onboarding tour breaks for keyboard-only users or screen reader users, those users drop off silently and your metrics never show it.

What to do about it:

1. Instrument keyboard navigation events separately (track when users Tab through tour steps vs. click)
2. Test your tour with VoiceOver and NVDA before measuring funnel performance
3. Combine analytics QA with accessibility QA in the same pass: verify that a button fires the right analytics event *and* has the correct ARIA label

## From metrics to action: the funnel improvement loop

Collecting funnel data is half the job. The other half is a repeatable process for turning drop-off data into specific product changes, then verifying those changes improved activation quality rather than just moving the completion number.

### Step 1: Find the biggest leak

Sort your funnel steps by drop-off percentage. The step with the highest drop-off rate is your starting point. Don't try to fix everything at once.

### Step 2: Watch session replays at the drop-off point

Numbers show *where* users drop. Session replays show *why*. Else van der Berg, writing about onboarding analytics, notes that 30-minute moderated user shadowing sessions are the fastest way to understand drop-off causes, faster than weeks of A/B testing the wrong hypothesis ([Else van der Berg](https://elsevanderberg.substack.com/p/product-analytics-101-onboarding)).

### Step 3: Fix and measure activation quality

After fixing the leak, don't just check if drop-off decreased. Verify that activation *quality* improved. "The goal is to prioritize the leak that most impacts activation, validate root cause with session context, and confirm your fix improved activation quality, not just onboarding completion" ([parallelhq.com](https://www.parallelhq.com/blog/what-funnel-analysis)).

### Step 4: Repeat with the next biggest leak

This isn't a project with an end date. Funnels drift as your product changes. Budget one review cycle per sprint.

## Common mistakes to avoid

Four patterns come up repeatedly when teams start measuring onboarding funnels, and each one wastes cycles if you don't catch it early.

**Chasing completion rate instead of activation.** A tour that users click through mindlessly has high completion and zero impact. Measure whether users do the activation action after the tour, not whether they watched it.

**Using generic benchmarks as targets.** A 37.5% activation rate is average for B2B SaaS. For your FinTech app, 10% might be exceptional. Benchmark against your own previous quarter first.

**Skipping qualitative research.** As van der Berg puts it: "You can tweak your funnel until the cows come home, but if your product isn't anything special to begin with, you won't get far" ([Else van der Berg](https://elsevanderberg.substack.com/p/product-analytics-101-onboarding)). Session replays and user interviews catch problems that numbers alone can't surface.

**Ignoring the accessibility gap.** If you haven't tested your onboarding with keyboard navigation and screen readers, your funnel data has a structural blind spot. Fix accessibility first, then trust your metrics.

## FAQ

### What is the average onboarding drop-off rate for SaaS?

Onboarding drop-off rates for SaaS products typically range from 30% to 50%, with 79% of total funnel drop-off concentrated at the top of the funnel between signup and first meaningful action. Products that reduce time-to-value below 5 minutes see trial-to-paid conversion rates above 25%, according to Chameleon's 2026 benchmark data.

### How do you track funnel analysis onboarding in React?

Track funnel analysis onboarding in React by instrumenting step-level events through your tour library's callback hooks. Tour Kit provides `onStepChange`, `onComplete`, and `onDismiss` callbacks that you wire to your analytics provider. Capture the step ID, step index, and timestamp for each event, then build a funnel chart in PostHog, Amplitude, or GA4.

### What is the difference between a funnel and a path in onboarding analytics?

A funnel measures linear progression through ordered steps, calculating compounding drop-off at each stage. Path analysis captures the varied routes users actually take, including backtracking and skipped steps. Funnels answer "what percentage reach step N?" while paths answer "where do users go?" Product tours are funnel-shaped by design, but user behavior within them follows paths.

### What is a good user activation funnel conversion rate?

A good user activation funnel conversion rate depends on industry. AI/ML tools average 54.8%, B2B SaaS averages 37.5%, and FinTech sits around 5%. Target 40-50% within the first session for most B2B products. Benchmark against your own historical data, since a FinTech app at 10% may be outperforming its category.

### Can analytics tools track screen reader users in onboarding funnels?

No. Analytics tools including Google Analytics cannot determine whether a user navigates with a screen reader, and this is intentional for privacy reasons. This creates a structural blind spot in onboarding funnel data. To account for it, instrument keyboard navigation events separately, test tours with VoiceOver and NVDA before trusting funnel metrics, and combine analytics QA with accessibility QA.
