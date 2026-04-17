---
title: "Onboarding NPS: when to ask, how to calculate, and what to actually do with the score"
published: false
description: "Most teams collect NPS after onboarding and ignore it. Here's how to time it right, avoid calculation mistakes, and turn detractor feedback into retention wins."
tags: react, javascript, webdev, productivity
canonical_url: https://usertourkit.com/blog/onboarding-nps-survey
cover_image: https://usertourkit.com/og-images/onboarding-nps-survey.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/onboarding-nps-survey)*

# Onboarding NPS: when, how, and what to do with the score

Most teams ship an NPS survey after onboarding, glance at the number, and move on. The score sits in a dashboard somewhere. Detractors churn. Promoters never get asked for a referral. And the product team wonders why activation isn't improving.

The problem isn't collecting NPS. It's knowing when to ask, how to calculate it without misleading yourself, and what to actually do when a user scores you a 3.

This guide covers the full lifecycle of an onboarding NPS survey: timing, calculation, benchmarks, implementation in React, and the closed-loop actions that turn a vanity metric into a retention signal.

```bash
npm install @tourkit/core @tourkit/react @tourkit/surveys
```

## What is an onboarding NPS survey?

An onboarding NPS survey is a single-question feedback mechanism triggered after a user completes their initial product setup, asking "How likely are you to recommend this product?" on a 0-10 scale. Unlike generic NPS sent quarterly to your entire user base, onboarding NPS isolates the first-run experience and measures whether new users reached value before forming an opinion. According to Bain & Company, the creators of Net Promoter Score, relationship NPS benchmarks average between 20 and 50 for B2B SaaS ([Bain & Company, 2023](https://www.netpromotersystem.com/about/)), but onboarding-specific scores tend to run 10-15 points lower because users haven't yet experienced the product's full value.

## Why onboarding NPS matters for product teams

Onboarding NPS tells you something retention curves can't: whether users *felt* successful during setup, not just whether they clicked through the steps.

A user who completes every tour step but scores you a 4 is telling you the experience was confusing, slow, or irrelevant to their actual job. That signal arrives weeks before they churn. Teams using onboarding NPS as an early warning system report catching 30-40% of at-risk accounts before the first renewal conversation ([Gainsight, 2025](https://www.gainsight.com/guides/nps-benchmarks/)).

Three concrete reasons to measure it:

1. **Activation quality signal.** Tour completion rate tells you users finished. NPS tells you they cared. A 90% completion rate with a -10 NPS means your tour is thorough but annoying.

2. **Segmentation fuel.** Promoters (9-10) who just onboarded are your best candidates for case studies, referrals, and beta programs. Detractors (0-6) need immediate outreach before the impression hardens.

3. **Iteration speed.** When you change your onboarding flow, generic NPS takes months to reflect the impact. Onboarding NPS moves within a week because every respondent just experienced the new flow.

## How to calculate onboarding NPS

Onboarding NPS uses the standard Net Promoter Score formula: subtract the percentage of detractors (scores 0-6) from the percentage of promoters (scores 9-10), ignoring passives (7-8). The result ranges from -100 to +100. The formula is simple, but the gotchas around sample size, timing, and passive-blindness trip up most teams.

**NPS = % Promoters - % Detractors**

Respondents fall into three groups based on their 0-10 score:

| Group | Score range | What it means |
|---|---|---|
| Detractors | 0-6 | Actively dissatisfied. High churn risk. |
| Passives | 7-8 | Satisfied but not enthusiastic. Vulnerable to competitors. |
| Promoters | 9-10 | Enthusiastic. Likely to recommend and expand usage. |

If 100 users respond and 45 are promoters, 35 are passives, and 20 are detractors: NPS = 45% - 20% = +25. Passives don't factor into the calculation, but ignoring them is a mistake. They're the swing vote.

Here's the calculation in TypeScript:

```tsx
// src/utils/nps.ts
type NpsGroup = 'detractor' | 'passive' | 'promoter';

function classifyScore(score: number): NpsGroup {
  if (score <= 6) return 'detractor';
  if (score <= 8) return 'passive';
  return 'promoter';
}

function calculateNps(scores: number[]): number {
  if (scores.length === 0) return 0;

  const groups = scores.reduce(
    (acc, score) => {
      acc[classifyScore(score)]++;
      return acc;
    },
    { detractor: 0, passive: 0, promoter: 0 }
  );

  const total = scores.length;
  return Math.round(
    ((groups.promoter - groups.detractor) / total) * 100
  );
}
```

**Common mistakes that skew your score:**

- **Surveying too early.** Asking before the user completes onboarding measures first impressions, not onboarding quality. Wait until the user finishes the core flow.
- **Surveying too late.** After 7+ days, users conflate onboarding with general product experience. The 24-72 hour window after onboarding completion captures the freshest signal.
- **Low sample size.** NPS with fewer than 30 responses has a margin of error above ±15 points. Don't make product decisions on 12 responses.
- **Ignoring the follow-up question.** The score without context is a number. The open-ended "What's the main reason for your score?" is where the actionable insight lives.

## Benchmarks: what good looks like

Benchmarks vary wildly by industry, product complexity, and whether you're measuring relationship NPS or transactional NPS. Onboarding NPS is transactional, so expect lower absolute numbers than your overall company NPS.

| Score range | Rating | What it signals | Action |
|---|---|---|---|
| 50+ | Excellent | Users reach value quickly and feel guided | Double down. Ask promoters for referrals. |
| 30-49 | Good | Solid onboarding with room for improvement | Focus on converting passives to promoters. |
| 10-29 | Average | Users complete onboarding but struggle somewhere | Analyze detractor comments. A/B test flow changes. |
| 0-9 | Below average | Onboarding is a bottleneck to adoption | Qualitative interviews. Rebuild flow from scratch. |
| Negative | Critical | More detractors than promoters. Churn incoming. | Stop acquisition spend. Fix onboarding first. |

For context: B2B SaaS products with self-serve onboarding typically score between 20-40 on onboarding NPS. Enterprise products with guided onboarding score 30-55 because a CSM smooths the rough edges ([CustomerGauge, 2025](https://customergauge.com/benchmarks)). Developer tools tend to land lower (15-30) because developers are harsher critics and onboarding is often documentation-heavy rather than interactive.

## How to track onboarding NPS with Tour Kit

Tour Kit's `@tourkit/surveys` package includes NPS as a built-in survey type with scoring, fatigue prevention, and analytics hooks. Here's a minimal implementation that triggers an NPS survey after onboarding completes:

```tsx
// src/components/OnboardingNpsSurvey.tsx
import { useTour } from '@tourkit/react';
import { SurveyProvider, NpsSurvey } from '@tourkit/surveys';

export function OnboardingNpsSurvey() {
  const { isCompleted } = useTour('onboarding-tour');

  if (!isCompleted) return null;

  return (
    <SurveyProvider
      surveyId="onboarding-nps"
      config={{
        type: 'nps',
        delay: 2000,
        cooldown: 90,
        sampleRate: 0.5,
      }}
    >
      <NpsSurvey
        question="How likely are you to recommend this product?"
        followUp="What's the main reason for your score?"
        onSubmit={(response) => {
          console.log('NPS submitted:', response);
        }}
      />
    </SurveyProvider>
  );
}
```

A few things to note. The `cooldown` property prevents survey fatigue by blocking the survey for 90 days after a response. The `sampleRate` of 0.5 means only half your users see the survey, keeping response quality high.

And the `delay` gives users a breath between finishing the tour and being asked for feedback.

To wire this up with your analytics, add the `onSubmit` callback to push events to PostHog, Mixpanel, or whatever you use:

```tsx
import { useAnalytics } from '@tourkit/analytics';

const { track } = useAnalytics();

const handleSubmit = (response: NpsResponse) => {
  track('onboarding_nps_submitted', {
    score: response.score,
    group: classifyScore(response.score),
    followUp: response.followUp,
    tourId: 'onboarding-tour',
    completedAt: new Date().toISOString(),
  });
};
```

Tour Kit doesn't prescribe UI for the survey. You render it with your own components (shadcn/ui, Radix, whatever your design system uses). The headless approach means the survey matches your app instead of looking like a third-party widget. That's a tradeoff: you write more JSX, but the result is indistinguishable from your product.

One limitation worth mentioning: Tour Kit requires React 18+ and doesn't have a no-code visual builder. If your team isn't comfortable writing React components, a tool like Userpilot or Pendo ships NPS surveys with point-and-click setup. But you'll pay $200-500/month and lose control over when and how the survey renders.

## Five ways to improve your onboarding NPS

Collecting NPS without acting on it is vanity metrics in disguise. The score only becomes useful when you close the loop with detractors, segment responses by onboarding path, and correlate low scores with specific tour steps. Here are five patterns that move the number.

### 1. Close the loop within 48 hours

Detractors who hear back from a human within 48 hours are 2.3x more likely to stay than those who don't ([Retently, 2024](https://www.retently.com/blog/nps-benchmarks/)). This doesn't mean solving their problem instantly. It means acknowledging the feedback: "Hey, you mentioned the API setup was confusing. We're rewriting that section this sprint."

Set up an automated Slack alert for any score below 7. Route it to whoever owns onboarding.

### 2. Segment and act by group

Don't treat NPS as one number. Break responses into cohorts:

- **By plan tier.** Free users scoring low might have different expectations than enterprise users scoring low.
- **By onboarding path.** If users who complete the interactive tour score 15 points higher than users who skip it, you know the tour is working and the skip rate is the problem.
- **By time-to-complete.** Users who take 3x longer than average to finish onboarding almost always score lower. The bottleneck is the bug, not the survey.

### 3. Fix the step before the drop

Pair NPS data with tour step analytics. If 40% of detractors abandoned at step 4 before completing, step 4 is your problem. You don't need a user interview to figure that out.

Tour Kit's analytics package tracks per-step completion times and abandonment points. Cross-referencing that with NPS scores creates a heat map of where onboarding breaks.

### 4. A/B test the flow, not the question

Changing the NPS question or scale doesn't improve scores. Changing the onboarding experience does. Run two variants of your tour (different step order, different content, shorter vs longer) and compare NPS between them.

Sample size matters here. You need roughly 200 responses per variant to detect a 10-point NPS difference with 95% confidence. At a 30% response rate and 50% sample rate, that's about 1,300 new users per variant.

### 5. Track NPS trends over time, not snapshots

A single NPS score is a snapshot. The trend is the signal. Plot your weekly onboarding NPS on a rolling 4-week average. When it moves, correlate with what shipped that week. That's your feedback loop.

## Tools for onboarding NPS tracking

Most SaaS analytics stacks already include basic NPS survey functionality, but onboarding-specific triggering (firing the survey after a tour completes, not on a calendar schedule) is where tools diverge. You don't need a dedicated NPS platform if your stack already supports event-based survey triggers. Here's how the main options compare:

| Tool | NPS built-in | Onboarding triggers | Starting price | Best for |
|---|---|---|---|---|
| Tour Kit + @tourkit/surveys | Yes | Yes (tour completion events) | Free (MIT) / $99 one-time Pro | React teams who want code-level control |
| Formbricks | Yes | Yes (event-based) | Free (self-hosted) / $99/mo cloud | Teams wanting open-source survey infrastructure |
| Refiner | Yes | Yes (segment-based) | $99/mo | Product teams needing advanced targeting |
| Userpilot | Yes | Yes (flow completion) | $249/mo | Non-technical teams needing visual builder |
| Pendo | Yes | Yes (guide completion) | Custom pricing ($$$$) | Enterprise with existing Pendo deployment |

We built Tour Kit, so take the first row with appropriate skepticism. The honest tradeoff: Tour Kit gives you complete control over survey rendering, timing, and data ownership, but you need a React developer to implement it. If your team has a product manager who wants to change survey targeting without deploying code, Userpilot or Refiner are better fits.

For a deeper look at how Tour Kit's survey package integrates with analytics, see the [surveys documentation](https://usertourkit.com/docs/surveys) and the [Formbricks integration guide](https://usertourkit.com/blog/tour-kit-formbricks-in-app-surveys).

## FAQ

### When should I send an NPS survey after onboarding?

The recommended window is 24-72 hours after the user completes the onboarding tour, triggered by a completion event rather than a calendar delay. Surveying immediately after the last step can feel aggressive. A 24-hour buffer lets users form opinions based on actual usage, while waiting past 72 hours dilutes the onboarding signal.

### What is a good onboarding NPS score for SaaS?

A good onboarding NPS score for B2B SaaS is 30 or above, based on aggregated benchmarks from Gainsight and CustomerGauge as of 2025. Scores above 50 are excellent. Anything below 10 signals a broken onboarding flow that needs immediate attention. Developer tools typically score 10-15 points lower than business software because developers set higher usability bars.

### How many responses do I need for a reliable onboarding NPS?

You need a minimum of 30 responses for directional confidence and 100+ for statistical reliability. With fewer than 30 responses, a single detractor can swing your NPS by 3-5 points. At 200+ responses, your margin of error drops below ±7 points. If your onboarding volume is low, accumulate responses over 4-6 weeks before drawing conclusions.

### Should I survey every user or use sampling?

Sampling at 30-50% gives you reliable data without fatiguing your entire user base. Tour Kit's `sampleRate` config handles this automatically, randomly selecting which users see the onboarding NPS survey. The users who don't see the NPS survey can be targeted for CSAT or CES surveys instead, giving you broader signal without asking anyone twice.

### How is onboarding NPS different from relationship NPS?

Onboarding NPS is a transactional survey tied to completing product setup. Relationship NPS is a recurring survey sent to all users regardless of recent activity. Onboarding NPS scores typically run 10-15 points lower because users evaluate a fresh experience, not months of accumulated sentiment. Onboarding NPS is the leading indicator; relationship NPS is lagging.

---

*Get started with [Tour Kit](https://usertourkit.com/) — install `@tourkit/surveys` to add NPS surveys tied to your onboarding flow. View the full API in the [surveys docs](https://usertourkit.com/docs/surveys), or explore the [source on GitHub](https://github.com/DomiDex/tour-kit).*
