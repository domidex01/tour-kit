---
title: "In-app NPS vs post-tour feedback: when to ask"
slug: "in-app-nps-vs-post-tour-feedback"
canonical: https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback
tags: react, javascript, web-development, ux
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback)*

# In-app NPS vs post-tour feedback: when to ask

You just shipped a five-step product tour for your dashboard. Users complete it, see a confetti animation, and then... what? A modal asks "How likely are you to recommend us to a friend?" on a 0-to-10 scale. The user picks 8, closes it, and you record a data point that tells you almost nothing useful.

That NPS score doesn't measure whether the tour was helpful. It doesn't measure whether the user understood the feature. It measures a half-formed loyalty opinion from someone who finished onboarding 12 seconds ago.

Asking the right question at the wrong moment is worse than not asking at all. And most product tour implementations get the timing wrong because they treat "NPS" as the default feedback mechanism for every touchpoint.

This guide breaks down which survey type belongs at which moment in the onboarding lifecycle, why NPS after tour completion is almost always a mistake, and how to collect feedback that actually improves your product.

## The survey type-to-moment mapping

Each survey type maps to a specific point in the product tour lifecycle:

| Survey type | What it measures | When to trigger | Response rate |
|---|---|---|---|
| **CES** | Friction in a specific interaction | Immediately after a tour step | 30-40% |
| **CSAT** | Satisfaction with the tour itself | After full tour completion | 20-35% |
| **NPS** | Long-term loyalty | 14-30 days after onboarding, every 90 days | 20-30% in-app, 5-15% email |

The pattern: transactional surveys (CES, CSAT) fire close to the event. Relationship surveys (NPS) fire after users have had time to form opinions. 49% of companies already combine NPS with at least one additional metric ([CustomerGauge, 2026](https://customergauge.com/blog/nps-csat-ces)).

## Why post-tour NPS surveys produce bad data

NPS measures loyalty. Loyalty requires experience over time. A user who completed onboarding 30 seconds ago hasn't formed a loyalty opinion.

We call this the honeymoon effect. Fresh off a well-designed tour, users score 8 or 9. Two months later, half of them have churned. Your NPS dashboard showed green, but the signal was noise.

As Smashing Magazine puts it: "What people say and what people do are often very different things" ([Smashing Magazine, 2024](https://www.smashingmagazine.com/2024/10/new-video-course-how-to-measure-ux-design-impact/)).

## CES at step completion

Customer Effort Score answers: "How easy was that?" Triggered right after a tour step, CES captures friction while the experience is fresh.

```tsx
import { useTour } from '@tourkit/react';
import { useSurvey } from '@tourkit/surveys';

function IntegrationTour() {
  const { trigger } = useSurvey();

  const handleStepComplete = (stepId: string) => {
    if (stepId === 'enter-api-key') {
      trigger({
        type: 'ces',
        question: 'How easy was it to find your API key?',
        delay: 500,
      });
    }
  };

  return (
    <TourProvider onStepComplete={handleStepComplete} steps={integrationSteps} />
  );
}
```

## CSAT at tour completion

CSAT belongs right when the tour ends. Keep it to a single 1-5 scale question. Adding open-text follow-up fields increases abandonment by 24% ([Zigpoll, 2026](https://zigpoll.com)).

## NPS after value realization

NPS makes sense 14-30 days after onboarding ([Gainsight, 2026](https://www.gainsight.com/blog/best-time-to-send-nps-survey-how-to-maximize-responses/)). Event-driven NPS (triggered at meaningful milestones) produces higher-quality scores than calendar-based sends.

Google and Slack use a 30/60/90-day milestone framework. Cap frequency to once per quarter after the initial send.

## Survey fatigue prevention

Never stack a survey on top of an active onboarding sequence:

```tsx
import { SurveyProvider } from '@tourkit/surveys';

function SurveyConfig({ children }) {
  return (
    <SurveyProvider
      fatigue={{
        cooldownMs: 7 * 24 * 60 * 60 * 1000,
        maxPerSession: 1,
        suppressDuringTour: true,
      }}
    >
      {children}
    </SurveyProvider>
  );
}
```

## Common mistakes

- **NPS on day one** — You're measuring first impressions, not loyalty
- **Surveying during active tours** — These compete for the same cognitive resources
- **Open-text as the primary question** — Scale questions take 3 seconds vs 30+ for open-text
- **Ignoring non-respondents** — 70% of users didn't answer, and they skew toward the middle

Full article with the complete implementation pattern and accessibility requirements: [usertourkit.com/blog/in-app-nps-vs-post-tour-feedback](https://usertourkit.com/blog/in-app-nps-vs-post-tour-feedback)

---

*Get started: [usertourkit.com](https://usertourkit.com/) | [GitHub](https://github.com/domidex01/tour-kit)*
