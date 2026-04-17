---
title: "Wire product tour events to HubSpot CRM workflows with React + TypeScript"
published: false
description: "Tour Kit's onComplete callback triggers a HubSpot contact property update, which enrolls the contact in a workflow. Lifecycle stage promotion, follow-up emails, and sales notifications — all from one API call."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-hubspot-crm-workflows
cover_image: https://usertourkit.com/og-images/tour-kit-hubspot-crm-workflows.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-hubspot-crm-workflows)*

# Tour Kit + HubSpot: trigger CRM workflows from tour completion

Most product tour libraries stop at "tour finished." The data dies in a localStorage flag. Meanwhile your sales team refreshes HubSpot wondering which trial users actually engaged with the product. This article connects those two worlds: Tour Kit's lifecycle callbacks fire, HubSpot's CRM updates, and a workflow enrolls the contact automatically.

We built this integration for a B2B SaaS dashboard and hit three gotchas along the way. Every code sample below runs against HubSpot's free CRM tier and Tour Kit's MIT packages. No $890/month Marketing Hub Professional required.

```bash
npm install @tourkit/core @tourkit/react @tourkit/analytics @hubspot/api-client
```

[See the full docs at usertourkit.com](https://usertourkit.com/)

## What you'll build

Tour Kit fires an `onComplete` callback when a user finishes a product tour. A single `PATCH` request to HubSpot's Contacts API v3 updates a custom contact property, which triggers a workflow that promotes the lifecycle stage, sends a follow-up email, and pings the sales rep on Slack. The whole chain completes in under 10 seconds with zero polling infrastructure.

The data flow:

| Step | System | Action |
|------|--------|--------|
| 1 | Tour Kit (browser) | `onComplete` fires with tour ID and step count |
| 2 | Your API route (server) | POST `/api/tour-completed` with user ID and tour metadata |
| 3 | HubSpot Contacts API | PATCH `/crm/v3/objects/contacts/{id}`, set `product_tour_completed = true` |
| 4 | HubSpot Workflow | Enrolls on property change, updates lifecycle stage, sends email |

No polling. No third-party middleware. One API call from your server to HubSpot's free CRM.

## Why HubSpot + Tour Kit?

HubSpot has no native product tour builder. The community has requested one twice, in 2021 and again in 2023 ([community thread](https://community.hubspot.com/t5/HubSpot-Ideas/In-app-Product-Tours/idi-p/471957)), but as of April 2026 it still hasn't shipped. That gap means you need a third-party tour tool that talks to HubSpot's CRM APIs. Competitors like Chameleon and Usetiful offer HubSpot integrations, but they inject their own SDK, can't match your design system, and charge per-MAU fees that grow with your user base.

Tour Kit takes a different approach. The `@tour-kit/analytics` plugin interface gives you a clean hook into every tour lifecycle event (`onStepView`, `onStepComplete`, `onDismiss`, `onComplete`) without coupling your UI to any specific analytics vendor. Write a HubSpot plugin once, and every tour in your app reports to HubSpot automatically.

The HubSpot Webhooks API is available on the free tier ([HubSpot developer docs](https://developers.hubspot.com/blog/implementing-webhooks-in-hubspot)). That means you get tour-to-CRM automation without upgrading to Professional. The $3,000 mandatory onboarding fee and $890/month Professional plan are only needed for HubSpot's Workflow Extensions or Custom Code Actions.

## Prerequisites

This integration requires a HubSpot account (the free CRM tier works), a Private App token for API access, Tour Kit installed in a React 18+ app, and one server-side API route to relay events. The whole setup takes about 30 minutes if you already have a working Tour Kit installation.

1. A HubSpot account (free CRM works) with a Private App token ([create one here](https://developers.hubspot.com/docs/api/private-apps))
2. A custom contact property in HubSpot called `product_tour_completed` (single-line text or boolean)
3. Tour Kit installed in your React app (`@tourkit/core` + `@tourkit/react`)
4. A server-side API route (Next.js API route, Express endpoint, or similar)

The Private App token replaced API keys in November 2022. Never expose it client-side.

## Step 1: set up the HubSpot client

The `@hubspot/api-client` Node.js SDK wraps HubSpot's REST API with typed methods for contacts, deals, and workflows. You'll use the Contacts Search API to find a user by email, then the Basic API to update custom properties. The SDK handles authentication, rate limiting (up to 1,000 webhook subscriptions per app), and retries out of the box.

```typescript
// src/lib/hubspot.ts
import { Client } from "@hubspot/api-client";

const hubspot = new Client({
  accessToken: process.env.HUBSPOT_PRIVATE_APP_TOKEN,
});

export async function updateContactTourStatus(
  email: string,
  tourId: string,
  stepsCompleted: number
) {
  const searchResponse =
    await hubspot.crm.contacts.searchApi.doSearch({
      filterGroups: [
        {
          filters: [
            {
              propertyName: "email",
              operator: "EQ",
              value: email,
            },
          ],
        },
      ],
      properties: ["email", "lifecyclestage"],
      limit: 1,
      after: "0",
      sorts: [],
    });

  const contact = searchResponse.results[0];
  if (!contact) return null;

  return hubspot.crm.contacts.basicApi.update(
    contact.id,
    {
      properties: {
        product_tour_completed: "true",
        last_tour_id: tourId,
        tour_steps_completed: String(stepsCompleted),
      },
    }
  );
}
```

Three custom properties (`product_tour_completed`, `last_tour_id`, and `tour_steps_completed`) give HubSpot enough context to trigger different workflows per tour. Create them in HubSpot under Settings > Properties > Contact Properties.

## Step 2: connect Tour Kit events to your API

The glue code between Tour Kit and HubSpot is an analytics plugin: a plain object that implements `onTourComplete` and fires a `POST` to your server. Tour Kit's `@tour-kit/analytics` package calls every registered plugin on each lifecycle event, so this single file covers all tours in your app without touching individual tour definitions.

```typescript
// src/lib/hubspot-tour-plugin.ts
import type { AnalyticsPlugin } from "@tourkit/analytics";

interface TourCompletePayload {
  tourId: string;
  stepsCompleted: number;
  userEmail: string;
}

export function createHubSpotPlugin(
  getUserEmail: () => string
): AnalyticsPlugin {
  return {
    name: "hubspot",

    onTourComplete(tourId: string, stepCount: number) {
      const payload: TourCompletePayload = {
        tourId,
        stepsCompleted: stepCount,
        userEmail: getUserEmail(),
      };

      // Fire-and-forget: don't block the UI
      fetch("/api/tour-completed", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }).catch((err) =>
        console.error("[hubspot-plugin] Failed to report:", err)
      );
    },
  };
}
```

Then register the plugin in your app's provider:

```tsx
// src/app/providers.tsx
import { TourProvider } from "@tourkit/react";
import { AnalyticsProvider } from "@tourkit/analytics";
import { createHubSpotPlugin } from "@/lib/hubspot-tour-plugin";
import { useAuth } from "@/lib/auth";

export function AppProviders({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();
  const hubspotPlugin = createHubSpotPlugin(
    () => user?.email ?? ""
  );

  return (
    <AnalyticsProvider plugins={[hubspotPlugin]}>
      <TourProvider>{children}</TourProvider>
    </AnalyticsProvider>
  );
}
```

## Step 3: build the API route and HubSpot workflow

The server-side API route authenticates the request, validates the session, and calls the HubSpot client from Step 1. This is the security boundary: the browser never sees your HubSpot Private App token, and the server verifies the user's identity before updating any CRM record. Here's the Next.js App Router version:

```typescript
// src/app/api/tour-completed/route.ts
import { NextResponse } from "next/server";
import { updateContactTourStatus } from "@/lib/hubspot";
import { getServerSession } from "@/lib/auth";

export async function POST(request: Request) {
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  const body = await request.json();
  const { tourId, stepsCompleted } = body;

  const result = await updateContactTourStatus(
    session.user.email,
    tourId,
    stepsCompleted
  );

  if (!result) {
    return NextResponse.json(
      { error: "Contact not found in HubSpot" },
      { status: 404 }
    );
  }

  return NextResponse.json({ status: "updated" });
}
```

Now set up the HubSpot workflow:

1. Go to Automation > Workflows > Create workflow
2. Choose "Contact-based" and "Blank workflow"
3. Set enrollment trigger: Contact property `product_tour_completed` is equal to `true`
4. Add actions: Update lifecycle stage to "Lead", send internal notification, delay 1 day, send follow-up email

The workflow fires within seconds of the API call. No cron jobs, no batch sync.

## Step 4: verify it works

Testing the full integration loop locally takes about 2 minutes. You complete a tour, watch the network request, and confirm the contact property updates in HubSpot's UI. If the workflow is active, you should see enrollment within 10 seconds of the API call landing.

1. Start your app and complete a product tour
2. Check your browser's Network tab for the POST to `/api/tour-completed` (should return 200)
3. Open HubSpot, find the contact, and confirm `product_tour_completed` is `true`
4. Check Automation > Workflows. The contact should appear in the enrollment history

The gotcha we hit: HubSpot's search API has a 1-2 second indexing delay after contact creation. If a user signs up and immediately completes a tour, the search might return nothing. We solved this by storing the HubSpot contact ID at signup time and passing it directly to the update call instead of searching by email every time.

## Going further

### Map lifecycle stages to tour milestones

HubSpot defines 8 default lifecycle stages (Subscriber, Lead, MQL, SQL, Opportunity, Customer, Evangelist, Other) that move forward by default. Mapping specific tour events to these stages gives your sales team a live signal of user intent without manual CRM data entry. Here's the mapping we use:

| Tour event | HubSpot lifecycle stage | Workflow action |
|---|---|---|
| Signed up, no tour started | Subscriber | Send welcome email |
| Completed onboarding tour | Lead | Assign to sales rep |
| Used key feature post-tour | MQL | Create deal, notify AE |
| Clicked upgrade CTA in tour | SQL | Schedule demo, priority routing |

Stages move forward only by default ([HubSpot lifecycle docs](https://knowledge.hubspot.com/records/use-lifecycle-stages)). Aligning tour milestones to these stages means your CRM reflects user intent in real time, not after a weekly sales sync.

### Reverse integration: HubSpot triggers Tour Kit

Webhooks work both directions. HubSpot can POST to your app when a deal stage changes or a contact goes cold. Picture this: a user's deal stalls for 14 days. HubSpot fires a webhook. Your app catches it and queues a re-engagement tour the next time that user logs in.

This bidirectional pattern turns Tour Kit into a CRM-aware onboarding layer, not just a tooltip renderer.

### Tour Kit limitation to know about

Tour Kit doesn't include a visual tour builder. You write tour steps in code (JSX + TypeScript), which means a product manager can't drag-and-drop tours in a GUI the way they can with Chameleon or Userpilot. For teams where non-developers own the onboarding flow, this is a real constraint. For engineering-led teams, it's actually a feature: your tours live in version control and deploy with your app.

Tour Kit also requires React 18 or later. If you're on an older React version, you'll need to upgrade before integrating.

## FAQ

### Can I use this integration with HubSpot's free CRM?

Tour Kit's integration works with HubSpot's free CRM tier. The Contacts API and custom properties are available on all plans. You only need Professional ($890/month as of April 2026) if you want HubSpot's native Workflow Extensions or Custom Code Actions. The workaround: use filter-based workflow enrollment on the Starter plan, which triggers on contact property changes.

### How fast does the HubSpot workflow fire after a tour completes?

Near real-time. The API call takes 200-400ms, and HubSpot's enrollment engine polls property changes every few seconds. In our testing, the full loop completed in under 10 seconds. Webhook subscriptions reduce API call volume by roughly 40% versus polling ([HubSpot developer blog](https://developers.hubspot.com/blog/implementing-webhooks-in-hubspot)).

### Does this integration work with Tour Kit's other packages?

Yes. The analytics plugin fires on events from `@tourkit/react`, `@tourkit/hints`, `@tourkit/checklists`, and `@tourkit/announcements`. If a user completes a checklist item or dismisses an announcement, those events flow through the same plugin to HubSpot. You get CRM visibility across your entire onboarding surface, not just product tours.

### What about GDPR and data privacy?

Tour Kit runs entirely in the user's browser and your server. No data passes through Tour Kit's infrastructure. The API call goes directly from your backend to HubSpot, so you control what contact properties get updated and when. For GDPR, ensure your HubSpot portal has consent tracking enabled and your privacy policy covers CRM data enrichment from in-app behavior.

### How does this compare to Chameleon's HubSpot integration?

Chameleon syncs HubSpot Lists into its targeting engine and pushes property updates back ([Chameleon docs](https://www.chameleon.io/integrations/hubspot)). It's managed and no-code. Tour Kit is code-first: you own the API route, data shape, and deployment. Chameleon charges per MAU; Tour Kit is $99 one-time Pro or free MIT.
