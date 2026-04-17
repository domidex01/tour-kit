---
title: "Connecting product tour events to Novu for omnichannel onboarding notifications"
published: false
description: "How to build a Tour Kit analytics plugin that triggers Novu workflows on tour completion, skip, and abandonment. In-app, email, and push from one API."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications
cover_image: https://usertourkit.com/og-images/tour-kit-novu-onboarding-notifications.png
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

Omnichannel onboarding (where in-app guidance, email, and push coordinate based on user behavior) retains users at roughly 2x the rate of single-channel approaches, with cross-channel campaigns boosting retention by 130% compared to 71% for in-app alone ([Braze, 2025](https://www.braze.com/resources/articles/onboarding-messages-example)). But most teams wire their product tour to one analytics tool and their email to another. The systems don't talk.

Novu solves this with a unified notification API. One `novu.trigger()` call can fan out to five channels: in-app, email, SMS, push, chat. The workflow orchestration layer handles delays, digests, channel preferences. You don't write that logic yourself.

| Approach | Channels | Code changes per channel | Digest/delay support |
|---|---|---|---|
| Manual (Resend + FCM + custom in-app) | 3 separate integrations | New service + API route each | You build it |
| Novu | In-App, Email, SMS, Push, Chat via one API | Zero (configure in Novu dashboard) | Built-in digest engine |

The tradeoff is operational complexity. Novu cloud handles hosting, but self-hosted Novu requires MongoDB, Redis, a Node.js backend. The `@novu/js` SDK ships at 1.67 MB unminified, so lazy-load it or use the lighter `@novu/node` package (649 KB) server-side only.

## Step 1: build the Novu analytics plugin

Tour Kit's `@tour-kit/analytics` package accepts plugins that implement a `track` method receiving a typed `TourEvent` with event name, tour ID, step index, duration, and custom metadata.

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

The gotcha we hit: Novu's `@novu/node` SDK is server-side only. Don't import it in a client component. If your Tour Kit setup runs entirely on the client, you need to proxy through an API route.

## Step 2: create the Novu workflow

In the Novu dashboard, create a workflow named `onboarding-tour-completed` with these steps:

1. **In-App**: immediate notification
2. **Delay**: wait 24 hours
3. **Email**: follow-up with features they haven't explored
4. **Digest**: batch additional completions within 6 hours

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
      amount: 24,
      unit: "hours",
    }));

    await step.email("follow-up-email", async () => ({
      subject: `You explored ${payload.totalSteps} features, here are 3 more`,
      body: `You completed the onboarding tour in ${Math.round(payload.duration / 1000)}s. 
             Here are features worth trying next...`,
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

## Step 3: proxy tour events through an API route

Since `@novu/node` runs server-side and Tour Kit's analytics callbacks execute in the browser, you need a thin server endpoint. Here's the client-safe plugin version:

```typescript
// src/lib/novu-analytics-plugin.ts (client-safe version)
import type { AnalyticsPlugin, TourEvent } from "@tourkit/analytics";

export const novuPlugin: AnalyticsPlugin = {
  name: "novu",

  async track(event: TourEvent) {
    const mapped = ["tour_completed", "tour_skipped", "tour_abandoned"];
    if (!mapped.includes(event.eventName)) return;

    await fetch("/api/tour-events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(event),
    });
  },
};
```

## Step 4: wire up the provider

```typescript
// src/app/providers.tsx
"use client";

import { TourProvider } from "@tourkit/react";
import { AnalyticsProvider } from "@tourkit/analytics";
import { novuPlugin } from "@/lib/novu-analytics-plugin";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider
      config={{
        plugins: [novuPlugin],
        userId: "current-user-id",
      }}
    >
      <TourProvider>
        {children}
      </TourProvider>
    </AnalyticsProvider>
  );
}
```

## Step 5: add the Novu inbox component

```typescript
// src/components/notification-bell.tsx
"use client";

import { Inbox } from "@novu/react";

export function NotificationBell() {
  return (
    <Inbox
      applicationIdentifier={process.env.NEXT_PUBLIC_NOVU_APP_ID!}
      subscriberId="current-user-id"
      routerPush={(path) => window.location.assign(path)}
    />
  );
}
```

When a tour completes and the Novu workflow fires, the bell lights up with the congratulation message within seconds. Novu auto-creates subscribers if the `subscriberId` doesn't exist yet.

## FAQ

**Can I use Novu with Tour Kit without a server-side API route?**
You need a proxy: a Next.js API route, Express endpoint, or serverless function. The SDK approach is recommended over raw REST calls because it handles retries and type safety.

**Does Novu's free tier cover a typical SaaS onboarding setup?**
Novu's free tier includes 10,000 events per month. For 1,000 MAUs completing 3 tours each, that's roughly 3,000 trigger events. Each workflow step counts separately.

**Is Tour Kit's analytics plugin compatible with other notification services?**
The same pattern works with Knock, Courier, or a custom service. Swap the `track` implementation and point it at a different API.

---

Full article with all code examples and comparison tables: [usertourkit.com/blog/tour-kit-novu-onboarding-notifications](https://usertourkit.com/blog/tour-kit-novu-onboarding-notifications)
