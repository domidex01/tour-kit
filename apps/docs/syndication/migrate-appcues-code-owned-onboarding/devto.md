---
title: "How I migrated from Appcues to code-owned onboarding in React"
published: false
description: "Appcues Growth costs $879/month at 2,500 MAUs. Here's how to replace it with a headless React library where tours live in your codebase and cost nothing per user."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding
cover_image: https://usertourkit.com/og-images/migrate-appcues-code-owned-onboarding.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)*

# Migrating from Appcues to code-owned onboarding

Appcues works until it doesn't. The $249/month starting price climbs as your MAU count grows, the "no-code" builder still needs a developer when flows get complex, and every tour you've built lives on someone else's servers. If your team has outgrown the tradeoffs, this guide walks through replacing Appcues with Tour Kit, a headless React library where onboarding flows live in your codebase, ship with your deploys, and cost nothing per user.

Budget 4-6 hours for a typical migration of 5-10 Appcues flows. You won't rip everything out on day one. The strategy here is incremental: install Tour Kit alongside Appcues, rebuild one flow at a time, run both systems in parallel, then remove the Appcues SDK once you're confident.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate from Appcues to code-owned onboarding?

Teams migrate from Appcues when per-user pricing outpaces the value delivered, when the "no-code" builder requires developer workarounds for complex flows, or when the lack of version control over onboarding content becomes a deployment risk. Here are the three patterns we see most often.

**Cost scales with users, not value.** Appcues Growth starts at $879/month for 2,500 MAUs on an annual contract ([TrustRadius, April 2026](https://www.trustradius.com/products/appcues/pricing)). Hit 5,000 MAUs and you're at $1,150+/month. A React library costs zero per user. For a B2B SaaS with 10,000 active users, the annual Appcues bill can top $15,000.

**"No-code" still needs developers.** One G2 reviewer wrote: "The implementation required us to hire JS developers. It was lengthy and confusing to set up" ([G2 Reviews, 2026](https://www.g2.com/products/appcues/reviews)). When flows need conditional logic or design system integration, teams write CSS overrides and JavaScript callbacks anyway. You end up maintaining two systems.

**Flows don't live in your repo.** Appcues stores every flow on their servers, not version-controlled alongside your components. You can't code-review a flow change or roll back a broken tooltip with `git revert`. Cancel your subscription and your onboarding disappears.

None of this means Appcues is bad. Your team might have simply crossed the threshold where owning the code costs less than renting the platform.

## Appcues to Tour Kit concept mapping

| Appcues concept | Tour Kit equivalent | Notes |
|---|---|---|
| Flow (multi-step) | `useTour()` with step array | Steps defined as TypeScript objects |
| Tooltip / Hotspot | `@tour-kit/hints` package | Beacon + popover, 5KB gzipped |
| Modal | `@tour-kit/announcements` | Modal, toast, banner, slideout, spotlight |
| Checklist | `@tour-kit/checklists` | Task dependencies and progress calculation |
| NPS survey | `@tour-kit/surveys` | NPS, CSAT, CES with fatigue prevention |
| Segment targeting | React conditional rendering | `if (user.role === 'admin')` |
| Analytics dashboard | `@tour-kit/analytics` + your stack | PostHog, Mixpanel, Amplitude, GA4, Plausible |
| Visual builder | No equivalent | Tour Kit is code-first |
| Appcues SDK | `@tourkit/core` at 8KB gzipped | Tree-shakeable, zero dependencies |

The visual builder is the one Appcues feature with no Tour Kit equivalent. If non-technical team members create flows without developer involvement today, this migration changes that workflow. Be upfront about it with your team before starting.

## Step 1: Audit your existing Appcues flows

Before writing a single line of Tour Kit code, log into the Appcues dashboard and catalog every active flow with its type, target page, segmentation rules, and weekly impression count. Most teams find that 30-40% of their flows are dead weight that shouldn't be migrated at all.

Sort the remaining flows by weekly impressions. Start with the highest-traffic flow.

```typescript
// src/migration/appcues-audit.ts
interface AppcuesFlow {
  name: string;
  type: 'tooltip' | 'modal' | 'checklist' | 'nps' | 'multi-step';
  targetPage: string;
  weeklyImpressions: number;
  segments: string[];
  steps: number;
  status: 'migrate' | 'kill' | 'defer';
}

const flowAudit: AppcuesFlow[] = [
  {
    name: 'New user onboarding',
    type: 'multi-step',
    targetPage: '/dashboard',
    weeklyImpressions: 1240,
    segments: ['new-users'],
    steps: 5,
    status: 'migrate',
  },
  {
    name: 'Feature announcement Q1',
    type: 'modal',
    targetPage: '/settings',
    weeklyImpressions: 0,
    segments: ['all'],
    steps: 1,
    status: 'kill',
  },
];
```

## Step 2: Install Tour Kit alongside Appcues

The safest migration path keeps Appcues running while you install Tour Kit as an additional dependency.

```bash
npm install @tourkit/core @tourkit/react
```

Wrap your app with the Tour Kit provider. Both systems coexist:

```tsx
// src/app/layout.tsx (Next.js App Router)
import { TourKitProvider } from '@tourkit/react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TourKitProvider>
          {children}
        </TourKitProvider>
      </body>
    </html>
  );
}
```

Tour Kit's core package is under 8KB gzipped with zero runtime dependencies.

## Step 3: Rebuild your highest-traffic flow

Here's a typical 5-step Appcues onboarding flow rebuilt with Tour Kit:

```tsx
// src/components/onboarding-tour.tsx
'use client';

import { useTour } from '@tourkit/react';

const steps = [
  {
    target: '#sidebar-nav',
    title: 'Navigate your workspace',
    content: 'Use the sidebar to switch between projects, settings, and team views.',
  },
  {
    target: '#create-button',
    title: 'Create your first project',
    content: 'Click here to set up a new project. It takes about 30 seconds.',
  },
  {
    target: '#invite-team',
    title: 'Invite your team',
    content: 'Add collaborators by email. They get access immediately.',
  },
];

export function OnboardingTour() {
  const tour = useTour({
    steps,
    onComplete: () => {
      fetch('/api/user/onboarding', { method: 'POST' });
    },
  });

  if (!tour.isActive) return null;

  return (
    <div role="dialog" aria-label="Onboarding tour">
      <h2>{tour.currentStep.title}</h2>
      <p>{tour.currentStep.content}</p>
      <div>
        <button onClick={tour.prev} disabled={tour.isFirst}>Back</button>
        <span>{tour.currentStepIndex + 1} / {tour.totalSteps}</span>
        <button onClick={tour.isLast ? tour.complete : tour.next}>
          {tour.isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  );
}
```

Step definitions are TypeScript objects you can code-review. The completion callback hits your own API. And the UI is plain JSX.

## Step 4: Add analytics and user targeting

Replace Appcues dashboard segment rules with conditional rendering:

```tsx
export function DashboardTours({ user }: { user: User }) {
  const isNewUser = Date.now() - user.createdAt < 7 * 24 * 60 * 60 * 1000;
  const isAdmin = user.role === 'admin';

  return (
    <>
      {isNewUser && <OnboardingTour />}
      {isAdmin && <AdminFeatureTour />}
    </>
  );
}
```

You can test this logic, debug it, set a breakpoint. No more guessing why a flow isn't showing.

## What you gain and what you lose

**What you gain:**
- Zero per-user cost. Tour Kit core is MIT-licensed. Pro packages cost $99 one-time.
- Version-controlled flows through pull requests.
- Design system integration. You render with your own components.
- React 19 and Server Components support.
- Full TypeScript coverage.
- Bundle size under 8KB gzipped for core.

**What you lose:**
- The visual builder. Non-technical team members need a developer.
- Hosted analytics dashboard. You build your own.
- Pre-built templates. You write components from scratch.

We built Tour Kit, so take this comparison with appropriate skepticism. Every claim is verifiable against npm, GitHub, and the Appcues pricing page.

Full article with all code examples and troubleshooting: [usertourkit.com/blog/migrate-appcues-code-owned-onboarding](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)
