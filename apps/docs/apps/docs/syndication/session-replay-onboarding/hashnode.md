---
title: "Session Replay for Onboarding: Finding Where Users Get Stuck"
slug: "session-replay-onboarding"
canonical: https://usertourkit.com/blog/session-replay-onboarding
tags: react, javascript, web-development, analytics, onboarding
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/session-replay-onboarding)*

# Session replay for onboarding: finding where users get stuck

Your onboarding funnel shows a 40% drop-off at step three. You know *where* users leave. You have no idea *why*. Perhaps the tooltip obscures the button they need to click. The form validation could be firing before they finish typing. Or the product tour skips a step on mobile viewports entirely. Funnel charts can't answer any of those questions. Session replay can.

This guide covers how to wire session replay into your onboarding flow, which tools fit different team sizes and budgets, and how to stay GDPR-compliant while recording user sessions.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What is session replay for onboarding?

Session replay for onboarding is the practice of recording and replaying user interactions during first-run experiences (product tours, setup wizards, checklist flows) to identify specific friction points that cause drop-off. Unlike funnel analytics that show aggregate conversion rates between steps, session replay captures the exact DOM state, mouse movements, clicks, and scroll behavior of individual users navigating your onboarding.

## Why session replay matters for onboarding teams

Funnel analytics tell you the conversion rate between step one and step two. What they can't show is that users are trying to paste a URL into a text field that only accepts plain text, or that the "Next" button renders below the fold on 13-inch laptops.

Sprig's analytics team put it concisely: "Analytics tell you where users drop off. Session replay shows you why" ([Sprig Blog](https://sprig.com/blog/session-replay-analytics)).

## Choosing a session replay tool

| Tool | Gzipped SDK size | Funnel-to-replay | Self-hosted | Free tier |
|------|-----------------|-------------------|-------------|-----------|
| PostHog | 52.4 KB | Yes (click-through) | Yes | 5K sessions/mo |
| Sentry | 29-36 KB | Yes (error-linked) | Yes | 500 replays/mo |
| FullStory | 58.8 KB | Yes (Journeys) | No | 30K sessions/mo |
| OpenReplay | ~45 KB | Yes | Yes (primary) | Self-hosted unlimited |
| Contentsquare | 553.4 KB | Yes | No | No |

Data sourced from [Rollbar's performance benchmark](https://rollbar.com/blog/session-replay-scripts-performance/) (April 2026).

## Connecting tour analytics to session replay

Wire tour lifecycle events into PostHog for replay filtering:

```tsx
import { TourProvider } from '@tourkit/react'
import { AnalyticsProvider } from '@tourkit/analytics'
import posthog from 'posthog-js'

function OnboardingTourProvider({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider
      onStepView={(stepId, tourId) => {
        posthog.capture('onboarding_step_view', {
          step_id: stepId,
          tour_id: tourId,
        })
      }}
      onTourComplete={(tourId) => {
        posthog.capture('onboarding_completed', { tour_id: tourId })
      }}
      onTourDismiss={(tourId, stepId) => {
        posthog.capture('onboarding_dismissed', {
          tour_id: tourId,
          dismissed_at_step: stepId,
        })
      }}
    >
      <TourProvider>{children}</TourProvider>
    </AnalyticsProvider>
  )
}
```

## Performance impact

Sentry measured their replay SDK's overhead:

- **FID:** +0.24ms (imperceptible)
- **TBT:** +373ms (~14% of main thread budget)
- **Memory:** ~6MB additional

Lazy-load replay for first-time users only to reduce bundle impact.

## Privacy and GDPR

Fines reach up to 20 million euros or 4% of annual global turnover. A privacy checklist:

1. Consent first. Load replay SDK after consent.
2. Mask onboarding inputs (workspace names, role selections).
3. Block file upload previews from capture.
4. Set 30-day retention limits.
5. Disclose replay vendor in your privacy policy.

## Common mistakes

- Watching every session instead of filtering for failed ones
- Recording without consent
- Ignoring mobile viewports
- Adding replay to every page
- Treating replay as a replacement for funnel analytics

---

Full article with all code examples and the open-source stack breakdown: [usertourkit.com/blog/session-replay-onboarding](https://usertourkit.com/blog/session-replay-onboarding)
