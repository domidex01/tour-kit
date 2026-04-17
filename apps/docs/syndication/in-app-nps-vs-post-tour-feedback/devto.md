---
title: "Stop asking NPS right after your product tour (here's what to ask instead)"
published: false
description: "In-app NPS surveys hit 20-40% response rates, but asking the wrong question at the wrong moment produces bad data. Here's the survey type-to-moment mapping that actually works."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback
cover_image: https://usertourkit.com/og-images/in-app-nps-vs-post-tour-feedback.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback)*

# In-app NPS vs post-tour feedback: when to ask

You just shipped a five-step product tour for your dashboard. Users complete it, see a confetti animation, and then... what? A modal asks "How likely are you to recommend us to a friend?" on a 0-to-10 scale. The user picks 8, closes it, and you record a data point that tells you almost nothing useful.

That NPS score doesn't measure whether the tour was helpful. It doesn't measure whether the user understood the feature. It measures a half-formed loyalty opinion from someone who finished onboarding 12 seconds ago.

Asking the right question at the wrong moment is worse than not asking at all. And most product tour implementations get the timing wrong because they treat "NPS" as the default feedback mechanism for every touchpoint.

```bash
npm install @tourkit/core @tourkit/react @tourkit/surveys
```

This guide breaks down which survey type belongs at which moment in the onboarding lifecycle, why NPS after tour completion is almost always a mistake, and how to collect feedback that actually improves your product.

## What is in-app NPS onboarding timing?

In-app NPS onboarding timing is the practice of choosing when, relative to a user's onboarding journey, to trigger a Net Promoter Score survey inside your application rather than through email or external channels. In-app surveys consistently hit 20-40% response rates compared to 5-15% for email ([Refiner.io, 2026](https://refiner.io/blog/in-app-nps/)). But response rate alone doesn't matter if you're asking the wrong question at the wrong lifecycle stage. The timing decision splits into two axes: which survey type (NPS, CSAT, or CES) and which trigger point (post-step, post-tour, or post-value-realization).

## Why in-app NPS onboarding timing matters for your product

Getting survey timing wrong doesn't just waste a data collection opportunity. It actively corrupts your feedback pipeline. Users who complete an onboarding tour are 2.5x more likely to convert to paid (Appcues 2024 Benchmark Report), but only if you measure the right things at each stage. Asking NPS at tour completion instead of CES produces misleading loyalty scores, inflates your dashboard metrics, and delays discovery of real friction points. The cost is invisible: you chase the wrong signal and miss the moments where intervention would have mattered.

## Why most post-tour NPS surveys produce bad data

NPS measures one thing: "How likely are you to recommend this product to a friend or colleague?" That's a loyalty question. Loyalty requires experience over time. A user who completed onboarding 30 seconds ago hasn't formed a loyalty opinion.

We call this the honeymoon effect. Fresh off a well-designed tour, users feel positive about the product. They score 8 or 9. Two months later, half of them have churned. Your NPS dashboard showed green, but the signal was noise.

The root cause is a category error. NPS, CSAT, and CES each measure fundamentally different things, and conflating them at the tour-completion moment pollutes all three signals.

As Smashing Magazine puts it: "What people say and what people do are often very different things" ([Smashing Magazine, 2024](https://www.smashingmagazine.com/2024/10/new-video-course-how-to-measure-ux-design-impact/)). This gap widens when users haven't had enough time to form genuine opinions.

## The survey type-to-moment mapping

Each survey type maps to a specific point in the product tour lifecycle. Getting this mapping right is the difference between actionable data and dashboard decoration.

| Survey type | What it measures | When to trigger | Response rate |
|---|---|---|---|
| **CES (Customer Effort Score)** | Friction in a specific interaction | Immediately after a tour step or task completion | 30-40% (in-app, contextual) |
| **CSAT (Customer Satisfaction)** | Satisfaction with the tour itself | Immediately after full tour completion | 20-35% (in-app) |
| **NPS (Net Promoter Score)** | Long-term loyalty and recommendation intent | 14-30 days after onboarding, then every 90 days | 20-30% (in-app), 5-15% (email) |

The pattern: transactional surveys (CES, CSAT) fire close to the event. Relationship surveys (NPS) fire after users have had time to form opinions. 49% of companies already combine NPS with at least one additional metric like CSAT or CES ([CustomerGauge, 2026](https://customergauge.com/blog/nps-csat-ces)).

## CES at step completion: measuring friction where it happens

Customer Effort Score answers a simple question: "How easy was that?" Triggered right after a user completes a specific tour step, CES captures friction while the experience is fresh. No recall bias. No reconstructed memory.

Consider a tour that walks users through connecting a Stripe integration. After the "enter API key" step, a CES survey asking "How easy was it to find your API key?" produces data you can act on immediately. If 40% of users score it 5/7 or below, that step needs redesign.

Here's what this looks like with Tour Kit's surveys package:

```tsx
// src/components/IntegrationTour.tsx
import { useTour } from '@tourkit/react';
import { useSurvey } from '@tourkit/surveys';

function IntegrationTour() {
  const { currentStep } = useTour();
  const { trigger } = useSurvey();

  const handleStepComplete = (stepId: string) => {
    if (stepId === 'enter-api-key') {
      trigger({
        type: 'ces',
        question: 'How easy was it to find your API key?',
        delay: 500, // half-second pause feels natural
      });
    }
  };

  return (
    <TourProvider
      onStepComplete={handleStepComplete}
      steps={integrationSteps}
    />
  );
}
```

The `delay: 500` matters. Firing the survey at the exact millisecond a step completes feels robotic. A brief pause lets the user's attention settle.

## CSAT at tour completion: rating the experience itself

CSAT belongs at the moment a user finishes a complete tour. Not during. Not three days later. Right at the end, while the experience is in working memory.

The question structure is simple: "How would you rate your experience with this tour?" on a 1-5 scale. Keep it to a single question. Adding open-text follow-up fields increases abandonment by 24% ([Zigpoll, 2026](https://zigpoll.com)). If you need qualitative feedback, ask a conditional follow-up only from users who score 1-2.

One thing we've noticed building Tour Kit: CSAT works best when the survey widget matches the tour's visual language. If your tooltip uses your design system's card component, your survey should too. A jarring visual switch signals "this is a different product" and drops completion rates.

Tour Kit doesn't prescribe visual styles (headless), so the CSAT component inherits whatever you've built.

## NPS after value realization: the 14-30 day rule

NPS makes sense only after users have experienced enough product value to form an opinion about recommending it. For most SaaS products, that window opens 14-30 days after onboarding ([Gainsight, 2026](https://www.gainsight.com/blog/best-time-to-send-nps-survey-how-to-maximize-responses/)).

The trigger shouldn't be time alone. Event-driven NPS, triggered when a user reaches a meaningful milestone, produces higher-quality scores than calendar-based sends. "User completed 10 projects" is a better NPS trigger than "user signed up 30 days ago." The first proves product engagement. The second proves only that time passed.

Google and Slack use a 30/60/90-day milestone framework for gathering feedback post-onboarding. The 90-day mark is where "new user" transitions to "established user" and NPS responses start reflecting genuine sentiment.

After the initial NPS send, cap frequency to once per quarter. Surveying more often than every 90 days produces diminishing returns and annoys your users.

## Survey fatigue during onboarding: the silent conversion killer

Onboarding is already cognitively demanding. A user is learning new navigation, new concepts, new workflows. Adding survey prompts on top of that cognitive load increases abandonment of the onboarding flow itself.

The rule: never stack a survey on top of an active onboarding sequence. If a user is mid-tour, the survey waits. Period.

Tour Kit's `@tour-kit/surveys` package handles this with built-in fatigue prevention:

```tsx
// src/providers/SurveyConfig.tsx
import { SurveyProvider } from '@tourkit/surveys';

function SurveyConfig({ children }: { children: React.ReactNode }) {
  return (
    <SurveyProvider
      fatigue={{
        cooldownMs: 7 * 24 * 60 * 60 * 1000, // 7 days between surveys
        maxPerSession: 1,
        suppressDuringTour: true, // blocks surveys while tour is active
      }}
    >
      {children}
    </SurveyProvider>
  );
}
```

The `suppressDuringTour: true` flag connects to Tour Kit's context system. When any tour is active, survey triggers queue instead of firing. Once the tour completes and the cooldown passes, the highest-priority queued survey displays.

For developer-facing products specifically, interruption sensitivity is amplified. Developers work in deep focus states. A survey popup mid-task doesn't just collect bad data — it breaks flow in a way that takes 15-20 minutes to recover from. Trigger surveys on navigation transitions or idle states, never during active task completion.

## Accessibility requirements for survey widgets

Most survey tools fail WCAG 2.1 AA compliance by default. A popup survey that steals focus without announcing itself to screen readers, lacks keyboard dismissal, or uses low-contrast rating scales creates accessibility barriers.

Tour Kit's survey components ship with the same accessibility standards as the tour components:

- Focus traps within the survey widget with keyboard escape to dismiss
- `aria-live="polite"` announcements when a survey appears
- Visible focus indicators on all interactive elements (rating scales, buttons)
- `prefers-reduced-motion` respected for survey animations
- Minimum 4.5:1 contrast ratios on all text elements

This isn't just compliance. Accessible surveys collect data from your entire user base, not just users who can see and click a mouse. If 5% of your users rely on screen readers and your survey widget doesn't support them, your feedback data has a 5% blind spot.

## Implementation: event-driven survey triggers with Tour Kit

Putting the timing framework into practice means wiring CES, CSAT, and NPS to different lifecycle events. Here's the complete pattern:

```tsx
// src/hooks/useFeedbackStrategy.ts
import { useSurvey } from '@tourkit/surveys';
import { useTour } from '@tourkit/react';
import { useCallback } from 'react';

export function useFeedbackStrategy() {
  const { trigger, schedule } = useSurvey();
  const { tourState } = useTour();

  const onStepComplete = useCallback((stepId: string) => {
    // CES for high-friction steps only
    const frictionSteps = ['api-key-entry', 'webhook-config', 'role-setup'];
    if (frictionSteps.includes(stepId)) {
      trigger({ type: 'ces', context: { stepId } });
    }
  }, [trigger]);

  const onTourComplete = useCallback((tourId: string) => {
    // CSAT immediately after tour
    trigger({ type: 'csat', context: { tourId } });

    // Schedule NPS for 30 days later
    schedule({
      type: 'nps',
      delayMs: 30 * 24 * 60 * 60 * 1000,
      context: { tourId, trigger: 'post-onboarding' },
    });
  }, [trigger, schedule]);

  return { onStepComplete, onTourComplete };
}
```

The `schedule` function persists the deferred NPS trigger. If the user doesn't return within 30 days, the survey fires on their next session after the delay expires. If the user already received an NPS survey from another trigger, the fatigue system suppresses the duplicate.

## Common mistakes to avoid

**Asking NPS on day one.** The user hasn't experienced your product yet. You're measuring first impressions, not loyalty. Wait at least 14 days, ideally 30.

**Surveying during active tours.** Your tour is teaching. Your survey is asking. These compete for the same cognitive resources. Suppress surveys while tours are active.

**Using open-text as the primary question.** Scale-based questions (1-5, 0-10) take 3 seconds. Open-text takes 30+ seconds and increases abandonment by 24%. Use open-text as an optional follow-up, not the lead.

**Ignoring non-respondents.** A 30% response rate means 70% of users didn't answer. Non-respondents skew toward the middle, neither thrilled nor angry enough to bother. Factor this into your analysis.

**Sending NPS by email after showing it in-app.** If the user already saw and dismissed the in-app survey, an email follow-up 7 days later can recover ~13% additional responses ([AskYazi, 2026](https://www.askyazi.com/articles/survey-response-rates-a-complete-guide-to-nps-and-post-interaction-feedback)). But sending both simultaneously is spam.

## Tools and libraries for in-app surveys

[Tour Kit](https://usertourkit.com/) (`@tour-kit/surveys`) handles CES, CSAT, and NPS with built-in fatigue prevention and tour-aware suppression. It's headless, so you control the visual design. We built Tour Kit, so take this recommendation with appropriate skepticism — but no other open-source tour library ships a survey package with lifecycle-aware triggering. Tour Kit requires React 18+ and has no visual builder, so you'll need developer resources to implement.

**Refiner.io** is a dedicated in-app survey platform with strong NPS timing controls and audience segmentation. Good for teams that want a standalone survey tool separate from their tour library.

**Sprig** (formerly UserLeap) focuses on in-product research with AI-powered analysis. Higher price point but useful if you need qualitative insights beyond scale-based responses.

**Hotjar** offers surveys alongside heatmaps and session recordings. The survey-specific features are less sophisticated than dedicated tools, but the combined analytics view is valuable.

## FAQ

### When should I trigger NPS after onboarding?

Tour Kit's recommended approach is to wait 14-30 days after onboarding completion before triggering NPS. Users need sufficient product experience to form genuine loyalty opinions. Triggering NPS immediately after a tour produces inflated scores that don't predict retention. Use CSAT for immediate post-tour feedback and reserve NPS for the 30-day milestone, then repeat every 90 days.

### What is the difference between NPS, CSAT, and CES for product tours?

CES (Customer Effort Score) measures friction at specific tour steps — "How easy was that?" CSAT measures satisfaction with the complete tour experience. NPS measures long-term recommendation intent, which requires weeks of product usage to form. Each maps to a different in-app NPS onboarding timing trigger: CES at step completion, CSAT at tour end, NPS at value realization 14-30 days later.

### How do I prevent survey fatigue during onboarding?

Set frequency caps (maximum one survey per session, 7-day cooldowns between surveys) and suppress all survey triggers while a product tour is actively running. Tour Kit's `@tour-kit/surveys` package includes `suppressDuringTour` and configurable cooldown periods. Queue lower-priority surveys instead of dropping them. They'll fire after the onboarding sequence completes and the cooldown expires.

### Do in-app NPS surveys get better response rates than email?

In-app NPS surveys achieve 20-40% response rates compared to 5-15% for email-based NPS ([Refiner.io, 2026](https://refiner.io/blog/in-app-nps/)). The advantage comes from capturing users while they're already engaged with your product. However, in-app surveys carry a higher risk of interrupting workflows, so contextual timing (triggering on navigation transitions rather than mid-task) is essential for maintaining both response rates and user satisfaction.

### Are survey widgets accessible by default?

Most in-app survey tools don't meet WCAG 2.1 AA standards out of the box. Common failures include missing keyboard navigation, absent screen reader announcements, and insufficient color contrast on rating scales. Tour Kit's survey components ship with focus traps, `aria-live` announcements, keyboard dismissal, and `prefers-reduced-motion` support. If you're building custom survey widgets, test with a screen reader (NVDA or VoiceOver) and verify all interactive elements are keyboard-reachable.

---

*Get started with Tour Kit's survey components: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/tourkit/tour-kit)*

```bash
npm install @tourkit/core @tourkit/react @tourkit/surveys
```
