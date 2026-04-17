---
title: "Session Replay + Product Tours: Finding Where Users Actually Get Stuck"
published: false
description: "Your onboarding funnel shows a 40% drop-off at step three. Funnel charts can't tell you why. Here's how to wire session replay into your onboarding flow to see exactly what users experience."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/session-replay-onboarding
cover_image: https://usertourkit.com/og-images/session-replay-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/session-replay-onboarding)*

# Session replay for onboarding: finding where users get stuck

Your onboarding funnel shows a 40% drop-off at step three. You know *where* users leave. You have no idea *why*. Perhaps the tooltip obscures the button they need to click. The form validation could be firing before they finish typing. Or the product tour skips a step on mobile viewports entirely. Funnel charts can't answer any of those questions. Session replay can.

This guide covers how to wire session replay into your onboarding flow, which tools fit different team sizes and budgets, and how to stay GDPR-compliant while recording user sessions.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics
```

## What is session replay for onboarding?

Session replay for onboarding is the practice of recording and replaying user interactions during first-run experiences (product tours, setup wizards, checklist flows) to identify specific friction points that cause drop-off. Unlike funnel analytics that show aggregate conversion rates between steps, session replay captures the exact DOM state, mouse movements, clicks, and scroll behavior of individual users navigating your onboarding. As of April 2026, tools like PostHog, Sentry, and FullStory offer session replay SDKs ranging from 29KB to 59KB gzipped.

## Why session replay matters for onboarding teams

Funnel analytics tell you the conversion rate between step one and step two, and that 23% of users abandon at the workspace creation screen. What they can't show is that users are trying to paste a URL into a text field that only accepts plain text, or that the "Next" button renders below the fold on 13-inch laptops.

Sprig's analytics team put it concisely: "Analytics tell you where users drop off. Session replay shows you why" ([Sprig Blog](https://sprig.com/blog/session-replay-analytics)).

A practical example from PostHog's documentation: filter for sessions where `onboarding_step_1` fired but `onboarding_completed` didn't. Watching ten of these sessions per week typically reveals the same two or three friction points in over half of them ([Cotera / PostHog Guide](https://cotera.co/articles/posthog-session-replay-guide)).

## Choosing a session replay tool for onboarding

| Tool | Gzipped SDK size | Funnel-to-replay | Self-hosted | Free tier |
|------|-----------------|-------------------|-------------|-----------|
| PostHog | 52.4 KB | Yes (click-through) | Yes | 5K sessions/mo |
| Sentry | 29-36 KB | Yes (error-linked) | Yes | 500 replays/mo |
| FullStory | 58.8 KB | Yes (Journeys) | No | 30K sessions/mo |
| OpenReplay | ~45 KB | Yes | Yes (primary) | Self-hosted unlimited |
| Contentsquare | 553.4 KB | Yes | No | No |

Data sourced from [Rollbar's performance benchmark](https://rollbar.com/blog/session-replay-scripts-performance/) (April 2026).

## Connecting tour analytics to session replay

Here's how to wire tour lifecycle events into PostHog for replay filtering:

```tsx
// src/providers/analytics-provider.tsx
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
      onStepComplete={(stepId, tourId) => {
        posthog.capture('onboarding_step_complete', {
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
      <TourProvider>
        {children}
      </TourProvider>
    </AnalyticsProvider>
  )
}
```

Once these events fire, the replay workflow becomes:

1. Open your PostHog funnel: `onboarding_step_view` > `onboarding_step_complete` > `onboarding_completed`
2. Click the drop-off bar at any step
3. PostHog shows the sessions where that step fired but the next one didn't
4. Watch three to five of those sessions
5. The pattern reveals itself

## Performance impact

Sentry measured their replay SDK's overhead on production sites ([Sentry Docs](https://docs.sentry.io/product/explore/session-replay/web/performance-overhead/)):

- **First Input Delay (FID):** +0.24ms increase (imperceptible)
- **Total Blocking Time (TBT):** +373ms increase (~14% of main thread budget)
- **Memory usage:** ~6MB additional

Lazy-load replay for first-time users only to mitigate bundle size impact:

```tsx
// src/hooks/use-conditional-replay.ts
import { useEffect } from 'react'

export function useConditionalReplay(isNewUser: boolean) {
  useEffect(() => {
    if (!isNewUser) return

    import('posthog-js').then((posthog) => {
      posthog.default.startSessionRecording()
    })

    return () => {
      import('posthog-js').then((posthog) => {
        posthog.default.stopSessionRecording()
      })
    }
  }, [isNewUser])
}
```

## Privacy and GDPR compliance

Session replay records user behavior. Fines reach up to 20 million euros or 4% of annual global turnover ([Hoop.dev](https://hoop.dev/blog/gdpr-compliance-in-session-replay)).

Modern replay SDKs ship "private by default." Sentry's documentation confirms that "the default configuration redacts all HTML text nodes and images before data leaves the browser" ([Sentry Privacy Docs](https://docs.sentry.io/security-legal-pii/scrubbing/protecting-user-privacy/)).

A privacy checklist for onboarding replay:

1. **Consent first.** Load the replay SDK after consent, not before.
2. **Mask onboarding inputs.** Workspace names, team names, role selections contain PII.
3. **Block file upload previews.** Block avatar upload elements from capture.
4. **Set retention limits.** Auto-delete after 30 days.
5. **Disclose in your privacy policy.** Name the replay vendor.

## Common mistakes

- **Watching every session.** Filter for failed sessions first. Ten filtered sessions per week beats fifty random ones.
- **Recording without consent.** Consent-first is the only safe pattern.
- **Ignoring mobile viewports.** Watch mobile replays separately from desktop.
- **Adding replay to every page.** Record onboarding flows and activation funnels only.
- **Treating replay as a replacement for analytics.** They work together, not as substitutes.

---

Full article with comparison table, code examples, and the open-source stack breakdown: [usertourkit.com/blog/session-replay-onboarding](https://usertourkit.com/blog/session-replay-onboarding)
