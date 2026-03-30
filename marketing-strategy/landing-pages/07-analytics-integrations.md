# Analytics & Integrations Landing Page

**URL:** `/analytics`
**Goal:** Show the integrations ecosystem and how Tour Kit connects to existing tools.
**SEO Target:** "product tour analytics", "onboarding analytics react", "tour tracking posthog mixpanel"
**Audience:** Teams already using analytics platforms who want onboarding data.

---

## Section 1: Hero

```
+------------------------------------------------------------------------+
|  [Logo]  Docs   Pricing   GitHub   Discord        [Get Started ->]     |
+------------------------------------------------------------------------+
|                                                                        |
|              Measure what matters.                                     |
|              Track every onboarding interaction.                       |
|                                                                        |
|         Plugin-based analytics that feeds tour completions,           |
|         hint interactions, and checklist progress directly            |
|         into your existing tools.                                     |
|                                                                        |
|         [Get Started]              [See Integrations]                  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 2: Supported Platforms

```
+------------------------------------------------------------------------+
|                                                                        |
|              Works with your stack.                                    |
|                                                                        |
|   +----------------+  +----------------+  +----------------+          |
|   |   [PostHog]    |  |  [Mixpanel]    |  |  [Amplitude]   |          |
|   |                |  |                |  |                |          |
|   |   First-party  |  |   First-party  |  |   First-party  |          |
|   |   plugin       |  |   plugin       |  |   plugin       |          |
|   |                |  |                |  |                |          |
|   |   [Docs ->]    |  |   [Docs ->]    |  |   [Docs ->]    |          |
|   +----------------+  +----------------+  +----------------+          |
|                                                                        |
|   +----------------+  +----------------+  +----------------+          |
|   |   [GA4]        |  |  [Segment]     |  |  [Custom]      |          |
|   |                |  |                |  |                |          |
|   |   Google       |  |   Via custom   |  |   Build your   |          |
|   |   Analytics 4  |  |   plugin       |  |   own plugin   |          |
|   |                |  |                |  |                |          |
|   |   [Docs ->]    |  |   [Docs ->]    |  |   [Guide ->]   |          |
|   +----------------+  +----------------+  +----------------+          |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 3: What Gets Tracked

```
+------------------------------------------------------------------------+
|                                                                        |
|              Every interaction. Zero setup.                           |
|                                                                        |
|   EVENT                          PROPERTIES                           |
|   +------------------------------------------------------------------+|
|   |  tour.started                | tourId, stepCount, userId         ||
|   |  tour.step.viewed            | tourId, stepId, stepIndex         ||
|   |  tour.step.completed         | tourId, stepId, duration          ||
|   |  tour.completed              | tourId, totalDuration             ||
|   |  tour.dismissed              | tourId, stepId, reason            ||
|   |------------------------------------------------------------------||
|   |  hint.shown                  | hintId, target, trigger           ||
|   |  hint.dismissed              | hintId, method (click/timeout)    ||
|   |  hint.action_clicked         | hintId, actionLabel               ||
|   |------------------------------------------------------------------||
|   |  checklist.started           | checklistId, taskCount            ||
|   |  checklist.task.completed    | checklistId, taskId               ||
|   |  checklist.completed         | checklistId, duration             ||
|   |------------------------------------------------------------------||
|   |  announcement.shown          | announcementId, variant           ||
|   |  announcement.dismissed      | announcementId, method            ||
|   |  announcement.cta_clicked    | announcementId, ctaLabel          ||
|   +------------------------------------------------------------------+|
|                                                                        |
|         All events fire automatically. No manual tracking code.       |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 4: Setup Code

```
+------------------------------------------------------------------------+
|                                                                        |
|              3 lines to connect.                                      |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  import { AnalyticsProvider, posthogPlugin }                   |  |
|   |    from '@tour-kit/analytics'                                  |  |
|   |                                                                |  |
|   |  <AnalyticsProvider                                            |  |
|   |    plugins={[posthogPlugin({ client: posthog })]}              |  |
|   |  >                                                             |  |
|   |    <App />                                                     |  |
|   |  </AnalyticsProvider>                                          |  |
|   |                                                                |  |
|   |  // That's it. All Tour Kit events now flow to PostHog.        |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 5: Custom Plugin

```
+------------------------------------------------------------------------+
|                                                                        |
|              Need something custom? Build a plugin in 10 lines.       |
|                                                                        |
|   +----------------------------------------------------------------+  |
|   |  import type { AnalyticsPlugin } from '@tour-kit/analytics'    |  |
|   |                                                                |  |
|   |  const myPlugin: AnalyticsPlugin = {                           |  |
|   |    name: 'my-analytics',                                      |  |
|   |    track: (event, properties) => {                             |  |
|   |      myAnalytics.send(event, properties)                      |  |
|   |    },                                                          |  |
|   |    identify: (userId, traits) => {                             |  |
|   |      myAnalytics.identify(userId, traits)                     |  |
|   |    },                                                          |  |
|   |  }                                                             |  |
|   +----------------------------------------------------------------+  |
|                                                                        |
+------------------------------------------------------------------------+
```

---

## Section 6: CTA

```
+------------------------------------------------------------------------+
|                                                                        |
|              Start measuring onboarding today.                        |
|                                                                        |
|         $ pnpm add @tour-kit/analytics                     [copy]    |
|                                                                        |
|         [Read the Docs]            [Plugin Guide]                     |
|                                                                        |
+------------------------------------------------------------------------+
```
