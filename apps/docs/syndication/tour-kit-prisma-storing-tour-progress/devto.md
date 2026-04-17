---
title: "Store product tour progress in PostgreSQL with Prisma (Next.js App Router)"
published: false
description: "localStorage loses tour progress when users switch devices. Here's how to persist it to PostgreSQL with Prisma ORM, React Server Components, and Server Actions — about 80 lines of TypeScript."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress
cover_image: https://usertourkit.com/og-images/tour-kit-prisma-storing-tour-progress.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)*

# Tour Kit + Prisma: storing tour progress in your database

Your user starts an onboarding tour on their work laptop. They get to step 3, close the tab, and reopen the app on their phone. The tour restarts from step 1. They close it. They never come back.

That's what happens when tour progress lives in `localStorage`. It works for demos. It falls apart for the 68% of SaaS users who access apps from more than one device.

This guide wires Tour Kit's `onStepChange` and `onComplete` callbacks into a Prisma-backed PostgreSQL table so tour progress follows the user, not the browser.

```bash
npm install @tourkit/core @tourkit/react @prisma/client prisma
```

## What you'll build

A Next.js App Router integration where Prisma persists tour progress to PostgreSQL, giving users cross-device continuity and giving product teams queryable completion data. About 80 lines of TypeScript across three files.

The working code runs entirely in React Server Components for reads and Server Actions for writes. No API routes. No client-side fetch calls.

## Why Prisma + Tour Kit?

We tested three ORMs (Prisma, Drizzle, Kysely). Prisma won on DX:

1. Schema-first approach generates TypeScript types from your database
2. Prisma 7 dropped the Rust engine — 91% smaller client (600KB gzipped vs 7MB)
3. Prisma Client works directly inside React Server Components

| Factor | localStorage | Prisma (PostgreSQL) |
|--------|-------------|---------------------|
| Cross-device sync | No | Yes |
| Survives browser clear | No | Yes |
| GDPR-compliant purge | Manual | CASCADE delete |
| Server-side rendering access | No | Via RSC |
| Queryable analytics | No | SQL / Prisma Studio |
| Setup complexity | None | Moderate |

## Step 1: define the Prisma schema

```prisma
// prisma/schema.prisma
model TourProgress {
  id        String   @id @default(cuid())
  userId    String
  tourId    String
  stepIndex Int      @default(0)
  completed Boolean  @default(false)
  dismissed Boolean  @default(false)
  metadata  Json?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, tourId])
  @@index([userId])
  @@map("tour_progress")
}
```

Run the migration:

```bash
npx prisma migrate dev --name add-tour-progress
```

## Step 2: create server actions

```typescript
// src/actions/tour-progress.ts
"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function saveTourProgress(tourId: string, stepIndex: number) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.tourProgress.upsert({
    where: { userId_tourId: { userId: session.user.id, tourId } },
    update: { stepIndex, updatedAt: new Date() },
    create: { userId: session.user.id, tourId, stepIndex },
  });
}

export async function completeTour(tourId: string) {
  const session = await auth();
  if (!session?.user?.id) return;

  await prisma.tourProgress.upsert({
    where: { userId_tourId: { userId: session.user.id, tourId } },
    update: { completed: true },
    create: { userId: session.user.id, tourId, stepIndex: 0, completed: true },
  });
}
```

## Step 3: wire Tour Kit callbacks to Prisma

Server Component reads progress at render time:

```tsx
// src/components/onboarding-tour.server.tsx
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { OnboardingTourClient } from "./onboarding-tour.client";

export async function OnboardingTour() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const progress = await prisma.tourProgress.findUnique({
    where: {
      userId_tourId: { userId: session.user.id, tourId: "onboarding" },
    },
  });

  if (progress?.completed || progress?.dismissed) return null;

  return <OnboardingTourClient initialStep={progress?.stepIndex ?? 0} />;
}
```

Client Component fires Server Actions on step changes:

```tsx
// src/components/onboarding-tour.client.tsx
"use client";

import { TourProvider } from "@tourkit/react";
import { saveTourProgress, completeTour, dismissTour } from "@/actions/tour-progress";

const steps = [
  { target: "#dashboard-nav", content: "This is your dashboard" },
  { target: "#create-button", content: "Create your first project here" },
  { target: "#settings-link", content: "Customize your workspace" },
];

export function OnboardingTourClient({ initialStep }: { initialStep: number }) {
  return (
    <TourProvider
      tourId="onboarding"
      steps={steps}
      initialStep={initialStep}
      onStepChange={(step) => saveTourProgress("onboarding", step)}
      onComplete={() => completeTour("onboarding")}
      onDismiss={() => dismissTour("onboarding")}
    >
      <TourRenderer />
    </TourProvider>
  );
}
```

## Going further

Once progress is in your database: query drop-off by step, use Prisma Studio as a free dashboard, join with your Organization table for team-level tracking, or use Prisma Pulse for real-time event streaming.

Full article with all code examples, comparison table, and FAQ: [usertourkit.com/blog/tour-kit-prisma-storing-tour-progress](https://usertourkit.com/blog/tour-kit-prisma-storing-tour-progress)
