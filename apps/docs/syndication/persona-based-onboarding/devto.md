---
title: "Persona-based onboarding in React: type-safe tours for every user segment"
published: false
description: "Your admin and your analyst shouldn't see the same product tour. Here's how to build persona-based onboarding with TypeScript discriminated unions and conditional step rendering."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/persona-based-onboarding
cover_image: https://usertourkit.com/og-images/persona-based-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/persona-based-onboarding)*

# Persona-based onboarding: showing different tours to different users

Your project management tool has three types of users. The marketing manager wants to see campaign dashboards and reporting. The developer wants API docs and webhook setup. The team lead wants resource allocation and sprint views. You're showing all three the same 12-step tour.

That's not onboarding. That's a slideshow.

As of April 2026, personalized onboarding increases 30-day retention by 52% and feature adoption by 42% compared to one-size-fits-all flows ([UserGuiding, 2026](https://userguiding.com/blog/user-onboarding-statistics)). ProdPad cut their activation time from six weeks to ten days by segmenting users into distinct personas and tailoring each path to a specific job-to-be-done ([Appcues, 2026](https://www.appcues.com/blog/persona-based-user-onboarding)).

Yet most React product tour tutorials stop at "highlight this element, show that tooltip." Nobody shows how to wire user personas into tour logic at the component level, with type safety, without loading every persona's tour config upfront.

This guide covers the full pattern: defining personas as TypeScript types, resolving them at runtime, rendering persona-specific tours with Tour Kit, and keeping the whole thing accessible.

```bash
npm install @tourkit/core @tourkit/react
```

## What is persona-based onboarding?

Persona-based onboarding is a pattern where your application presents different onboarding flows to different user segments based on their role, job function, experience level, or stated goals. Each persona sees only the steps relevant to their shortest path to value. Tour Kit implements this through its `when` prop on individual steps and a composable provider architecture that keeps persona-specific tour configurations as separate data objects. An admin sees 8 steps covering team settings and billing. A contributor sees 5 steps focused on creating their first item.

Don't confuse this with role-based routing. A role determines what a user _can_ do (permissions). A persona describes what a user _wants_ to do (intent). Your "admin" role might contain a technical founder who wants API access and a non-technical CEO who wants dashboards. Same permissions, completely different onboarding needs.

## Defining personas with TypeScript

The first step is modeling your personas as a discriminated union. This gives you exhaustive checking at compile time, so adding a new persona forces you to handle it everywhere.

```tsx
// src/types/personas.ts
type BasePersona = {
  id: string;
  displayName: string;
  tourId: string;
};

type AdminPersona = BasePersona & {
  kind: "admin";
  teamSize: number;
};

type DeveloperPersona = BasePersona & {
  kind: "developer";
  primaryLanguage: string;
};

type AnalystPersona = BasePersona & {
  kind: "analyst";
  dataSources: string[];
};

export type UserPersona = AdminPersona | DeveloperPersona | AnalystPersona;
```

The `kind` field is your discriminant. When you narrow on it in a switch statement, TypeScript knows exactly which fields are available. No type assertions needed.

SaaS tools like Appcues and Pendo handle persona logic on their servers. You get a JSON blob and trust it. With a code-owned approach, the type system catches mismatches before production. Add a "designer" persona to the backend but forget to update the tour config? Compiler flags it.

## Resolving personas at runtime

Persona resolution bridges your auth system and tour logic. Where the data comes from varies (API response, JWT claims, onboarding survey), but the pattern stays the same: a React context that resolves the persona once and makes it available everywhere.

```tsx
// src/providers/PersonaProvider.tsx
import { createContext, useContext, useMemo } from "react";
import type { UserPersona } from "../types/personas";

type PersonaContextValue = {
  persona: UserPersona | null;
  isLoading: boolean;
};

const PersonaContext = createContext<PersonaContextValue>({
  persona: null,
  isLoading: true,
});

export function PersonaProvider({
  children,
  user,
}: {
  children: React.ReactNode;
  user: { role: string; onboardingAnswers?: Record<string, string> };
}) {
  const persona = useMemo(() => resolvePersona(user), [user]);

  return (
    <PersonaContext.Provider value={{ persona, isLoading: false }}>
      {children}
    </PersonaContext.Provider>
  );
}

export const usePersona = () => useContext(PersonaContext);
```

Business logic lives in `resolvePersona`. For a simple case, map roles directly. For richer segmentation, combine role with survey answers:

```tsx
// src/providers/resolve-persona.ts
function resolvePersona(user: {
  role: string;
  onboardingAnswers?: Record<string, string>;
}): UserPersona {
  const answers = user.onboardingAnswers ?? {};

  if (user.role === "admin") {
    return {
      kind: "admin",
      id: "admin",
      displayName: "Team Admin",
      tourId: "admin-onboarding",
      teamSize: Number(answers.teamSize) || 1,
    };
  }

  if (answers.primaryGoal === "build-integrations") {
    return {
      kind: "developer",
      id: "developer",
      displayName: "Developer",
      tourId: "developer-onboarding",
      primaryLanguage: answers.language || "typescript",
    };
  }

  return {
    kind: "analyst",
    id: "analyst",
    displayName: "Analyst",
    tourId: "analyst-onboarding",
    dataSources: (answers.dataSources || "").split(",").filter(Boolean),
  };
}
```

Notice that role alone isn't enough. The onboarding survey provides intent. A user with the "member" role who answered "build integrations" gets the developer persona, not the analyst persona. This is the difference between role-based routing and persona-based onboarding.

## Building persona-specific tours with Tour Kit

With personas resolved, you define separate tour configurations for each one and render the matching tour.

```tsx
// src/tours/persona-tours.ts
import type { TourStep } from "@tourkit/core";
import type { UserPersona } from "../types/personas";

const adminSteps: TourStep[] = [
  {
    id: "admin-team-settings",
    target: "#team-settings-btn",
    title: "Team settings",
    content: "Configure roles and permissions for your team.",
  },
  {
    id: "admin-billing",
    target: "#billing-link",
    title: "Billing overview",
    content: "Review your plan and manage payment methods.",
  },
];

const developerSteps: TourStep[] = [
  {
    id: "dev-api-keys",
    target: "#api-keys-section",
    title: "Your API keys",
    content: "Generate keys to authenticate your integrations.",
  },
  {
    id: "dev-webhooks",
    target: "#webhooks-link",
    title: "Webhooks",
    content: "Set up event-driven integrations with your stack.",
  },
];

export function getStepsForPersona(persona: UserPersona): TourStep[] {
  switch (persona.kind) {
    case "admin":
      return adminSteps;
    case "developer":
      return developerSteps;
    case "analyst":
      return analystSteps;
  }
}
```

The `switch` on `persona.kind` is exhaustive. Add a fourth persona and TypeScript errors until you add its steps.

Wire it into the component tree:

```tsx
// src/components/PersonaOnboarding.tsx
"use client";

import { TourProvider, Tour, TourStep } from "@tourkit/react";
import { usePersona } from "../providers/PersonaProvider";
import { getStepsForPersona } from "../tours/persona-tours";

export function PersonaOnboarding() {
  const { persona, isLoading } = usePersona();

  if (isLoading || !persona) return null;

  const steps = getStepsForPersona(persona);

  return (
    <TourProvider>
      <Tour tourId={persona.tourId} steps={steps}>
        {steps.map((step) => (
          <TourStep key={step.id} id={step.id} />
        ))}
      </Tour>
    </TourProvider>
  );
}
```

Each persona gets its own `tourId`, so Tour Kit tracks completion independently.

## The "when" prop: mixing personas within a single tour

Sometimes you want a shared tour with persona-specific steps mixed in. Tour Kit's `when` prop handles this without splitting into separate configurations.

```tsx
export const sharedOnboardingSteps: TourStep[] = [
  {
    id: "welcome",
    target: "#app-header",
    title: "Welcome to Acme",
    content: "A quick tour of the features you'll use most.",
  },
  {
    id: "admin-settings",
    target: "#settings-gear",
    title: "Team settings",
    content: "Manage your team's access and billing.",
    when: (ctx) => ctx.meta?.persona?.kind === "admin",
  },
  {
    id: "dev-api",
    target: "#api-section",
    title: "API access",
    content: "Your keys and webhook configuration.",
    when: (ctx) => ctx.meta?.persona?.kind === "developer",
  },
];
```

Pass the persona through `meta`:

```tsx
<Tour
  tourId="shared-onboarding"
  steps={sharedOnboardingSteps}
  meta={{ persona }}
/>
```

Tour Kit evaluates `when` before rendering each step. If it returns `false`, the step is skipped entirely. No DOM manipulation, no wasted renders.

## Measuring persona tour effectiveness

Tour Kit's analytics hooks fire events for step views, completions, and dismissals, tagged with the `tourId` per persona.

```tsx
<TourProvider
  onStepView={(tourId, stepId) => {
    analytics.track("tour_step_viewed", { tourId, stepId });
  }}
  onTourComplete={(tourId) => {
    analytics.track("tour_completed", { tourId });
  }}
  onTourDismiss={(tourId, stepId) => {
    analytics.track("tour_dismissed", { tourId, lastStep: stepId });
  }}
>
  {children}
</TourProvider>
```

Because each persona has a unique `tourId`, PostHog, Mixpanel, or Amplitude can segment completion funnels per persona without extra tagging. Which persona converts best? Which step do analysts drop off at?

ProdPad found that persona-segmented analytics revealed their "project manager" persona was completing onboarding 3x faster than their "product owner" persona, which led them to shorten the product owner flow ([Appcues, 2026](https://www.appcues.com/blog/persona-based-user-onboarding)).

## Common mistakes to avoid

**Confusing roles with personas.** A "viewer" role tells you about permissions. It says nothing about whether the viewer is a client, an executive, or a student. Ask _what the user wants to accomplish_.

**Too many personas.** Start with three. ProdPad started with three and only added a fourth after six months of data confirmed a distinct behavior pattern.

**Building persona logic into the tour library.** Tour Kit doesn't have a `persona` prop because personas are your business logic. Keep resolution in your app layer. Pass the result through `meta` or separate configs.

**Skipping measurement.** If you can't answer "which persona converts best and why?", you don't have a feedback loop. Wire analytics first.

## FAQ

### How many personas should I start with?

Start with three maximum. More creates maintenance overhead without proportional conversion gains. Define each persona by their primary job-to-be-done, not by demographic or company size.

### Does persona-based onboarding hurt performance?

Tour Kit's core adds under 8KB gzipped regardless of persona count. Dynamic imports split each persona's config into its own chunk, reducing per-user payload to 4-6KB.

### Can I combine persona-based onboarding with feature flags?

Feature flags gate _visibility_ (should this user see a tour?), while persona logic determines _content_ (which steps?). Use PostHog or LaunchDarkly for rollout, and Tour Kit's `when` prop for persona-specific steps.

### How do I handle users who fit multiple personas?

Pick a primary persona based on the user's stated goal during signup. Tour Kit tracks completion per `tourId`, so finishing one persona's tour doesn't mark another as complete.

---

_Get started with Tour Kit at [usertourkit.com](https://usertourkit.com/). Source code on [GitHub](https://github.com/domidex01/tour-kit)._

```bash
npm install @tourkit/core @tourkit/react
```
