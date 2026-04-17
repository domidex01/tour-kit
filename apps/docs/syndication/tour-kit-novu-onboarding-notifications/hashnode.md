---
title: "Tour Kit + Novu: omnichannel onboarding notifications"
slug: "tour-kit-novu-onboarding-notifications"
canonical: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications
tags: react, typescript, notifications, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications)*

# Tour Kit + Novu: omnichannel onboarding notifications

A product tour teaches your user something. Then it vanishes. If that user doesn't come back, the lesson disappears with it. The fix isn't a longer tour or more tooltips. It's a notification (an email, a push message, an in-app reminder) that arrives based on what actually happened during the tour.

Novu is open-source notification infrastructure that sends across in-app, email, SMS, push, and chat channels through a single API. As of April 2026, it has over 36,000 GitHub stars, 400+ contributors, and ships a free tier of 10,000 events per month. Tour Kit's analytics plugin system gives you structured events for every tour lifecycle moment. Connect the two, and your onboarding doesn't stop at the browser tab.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics @novu/node
```

The [Tour Kit docs](https://usertourkit.com/) cover the full analytics plugin API used in this guide.

## What you'll build

This guide produces a Tour Kit analytics plugin that fires Novu workflow triggers whenever a user completes, skips, or abandons a tour. Novu then handles routing: in-app notification immediately, email 24 hours later if the user hasn't returned, push notification on day three. About 60 lines of TypeScript for the plugin, plus a Novu workflow definition.

Tour Kit requires React 18+ and doesn't have a visual builder. You write steps in code. If your team needs drag-and-drop tour creation, Chameleon or Appcues are better fits.

## Why Novu + Tour Kit?

Omnichannel onboarding (where in-app guidance, email, and push coordinate based on user behavior) retains users at roughly 2x the rate of single-channel approaches, with cross-channel campaigns boosting retention by 130% compared to 71% for in-app alone ([Braze, 2025](https://www.braze.com/resources/articles/onboarding-messages-example)).

Novu solves this with a unified notification API. One `novu.trigger()` call can fan out to five channels: in-app, email, SMS, push, chat. The workflow orchestration layer handles delays, digests, channel preferences. You don't write that logic yourself.

| Approach | Channels | Code changes per channel | Digest/delay support |
|---|---|---|---|
| Manual (Resend + FCM + custom in-app) | 3 separate integrations | New service + API route each | You build it |
| Novu | In-App, Email, SMS, Push, Chat via one API | Zero (configure in Novu dashboard) | Built-in digest engine |

## Step 1: build the Novu analytics plugin

```typescript
// src/lib/novu-analytics-plugin.ts
import { Novu } from "@novu/node";
import type { AnalyticsPlugin, TourEvent } from "@tourkit/analytics";

const novu = new Novu({ secretKey: process.env.NOVU_API_KEY! });

const WORKFLOW_MAP: Record<string, string> = {
  tour_completed: "onboarding-tour-completed",
  tour_skipped: "onboarding-tour-skipped",
  tour_abandoned: "onboarding-tour-abandoned",
};

export const novuPlugin: AnalyticsPlugin = {
  name: "novu",
  async track(event: TourEvent) {
    const workflowId = WORKFLOW_MAP[event.eventName];
    if (!workflowId) return;
    await novu.trigger({
      name: workflowId,
      to: { subscriberId: event.userId ?? "anonymous" },
      payload: {
        tourId: event.tourId,
        stepId: event.stepId,
        stepIndex: event.stepIndex,
        totalSteps: event.totalSteps,
        duration: event.duration,
        completedAt: new Date(event.timestamp).toISOString(),
        ...event.metadata,
      },
    });
  },
};
```

The gotcha we hit: Novu's `@novu/node` SDK is server-side only. For client-side Tour Kit setups, proxy through an API route.

## Step 2: create the Novu workflow

```typescript
// src/novu/workflows/onboarding-tour-completed.ts
import { workflow } from "@novu/framework";

export const tourCompletedWorkflow = workflow(
  "onboarding-tour-completed",
  async ({ step, payload }) => {
    await step.inApp("congrats-notification", async () => ({
      subject: "Tour completed",
      body: `You finished the ${payload.tourId} tour. Check out what's next.`,
    }));
    await step.delay("wait-for-return", async () => ({
      amount: 24, unit: "hours",
    }));
    await step.email("follow-up-email", async () => ({
      subject: `You explored ${payload.totalSteps} features, here are 3 more`,
      body: `You completed the onboarding tour. Here are features worth trying next...`,
    }));
  },
  {
    payloadSchema: {
      type: "object",
      properties: {
        tourId: { type: "string" },
        totalSteps: { type: "number" },
        duration: { type: "number" },
        completedAt: { type: "string" },
      },
    },
  }
);
```

## Steps 3-5: API route, provider, inbox

The full article covers the client-safe plugin version (via API route proxy), provider wiring, and adding Novu's `<Inbox />` component for in-app notifications.

Full walkthrough with all code: [usertourkit.com/blog/tour-kit-novu-onboarding-notifications](https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications)
