---
title: "Tour Kit + Clerk: role-based tours with auth context"
slug: "tour-kit-clerk-role-based-tours"
canonical: https://usertourkit.com/blog/tour-kit-clerk-role-based-tours
tags: react, typescript, web-development, authentication
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-clerk-role-based-tours)*

# Tour Kit + Clerk: role-based tours with auth context

Your admin needs a tour of billing settings, team management, and API keys. Your member needs a tour of the dashboard, task creation, and notifications. Showing both the same 12-step walkthrough wastes everyone's time and teaches nobody anything.

Clerk gives you the auth context. Tour Kit gives you the tour engine. The glue between them is about 30 lines of TypeScript. As of April 2026, Clerk's free tier covers 50,000 monthly active users ([Clerk pricing, Feb 2026](https://clerk.com/changelog/2026-02-05-new-plans-more-value)), and Tour Kit's core ships at under 8KB gzipped. That's a role-based onboarding system for $0 at most startup scales.

This tutorial walks through wiring Clerk's `useAuth()`, `useUser()`, and `useOrganization()` hooks into Tour Kit's `when` prop so each role sees only the steps relevant to their permissions.

```bash
npm install @tourkit/core @tourkit/react @clerk/nextjs
```

Check out the [Tour Kit docs](https://usertourkit.com/) for full API reference.

## What you'll build

A role-aware onboarding tour reading Clerk's organization membership, filtering steps per user. Admins see 4 steps, members see 3, custom roles get tailored subsets. Total glue code: under 50 lines of TypeScript across 3 files.

- Admins see tour steps covering billing, team management, and settings
- Members see tour steps covering the dashboard, task creation, and collaboration features
- Custom roles (like `analyst` or `moderator`) get tailored steps matching their permissions
- Tour state persists per user through Clerk's `publicMetadata`

No backend changes required.

## Why Clerk + Tour Kit?

Clerk serves over 300,000 applications as of early 2026, with a free tier covering 50,000 MAU and Pro starting at $0.02/MAU after that. Auth0 charges $0.07/MAU after just 7,500 free users. For a 40,000-user SaaS app, Clerk costs $0 while Auth0 runs roughly $2,275/month.

Both APIs are hook-based and TypeScript-first. Clerk's `useAuth`, `useUser`, and `useOrganization` expose role data in client components. Tour Kit's `when` prop accepts a filtering function.

| Approach | Auth cost (40K MAU) | Tour library | Combined bundle | Role filtering |
|---|---|---|---|---|
| Clerk + Tour Kit | $0/mo | Free (MIT) | ~8KB gzipped (tour only) | Built-in via hooks |
| Auth0 + React Joyride | ~$2,275/mo | Free (MIT) | ~37KB gzipped | DIY with React Context |
| Clerk + Appcues | $0/mo | ~$300/mo | External script (~180KB) | Segment-based UI |
| WalkMe enterprise | Included | ~$15,000+/yr | External script (~250KB) | Built-in RBAC targeting |

## Step 1: read roles from Clerk's organization hooks

Clerk's `useOrganization()` hook returns the membership object with `role` and `permissions`. Wrap it in a custom hook:

```tsx
// src/hooks/use-clerk-role.ts
import { useOrganization, useUser } from "@clerk/nextjs";

export type ClerkRole = "org:admin" | "org:member" | string;

export function useClerkRole() {
  const { membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();

  const isLoaded = orgLoaded && userLoaded;
  const role: ClerkRole = membership?.role ?? "org:member";

  const hasPermission = (permission: string): boolean => {
    if (!membership) return false;
    return membership.permissions?.includes(permission) ?? false;
  };

  return { role, isLoaded, userId: user?.id ?? null, hasPermission };
}
```

Gotcha: Clerk's 8 system permissions are **not** in session claims. Use custom permissions for tour gating. See [Clerk's RBAC guide](https://clerk.com/docs/guides/organizations/control-access/roles-and-permissions).

## Step 2: define role-filtered tour steps

```tsx
// src/tours/dashboard-tour.ts
import type { TourStep } from "@tourkit/core";

type RoleContext = { role: string; hasPermission: (p: string) => boolean };

export function getDashboardSteps(ctx: RoleContext): TourStep[] {
  return [
    { id: "welcome", target: "#dashboard-header", title: "Welcome to your dashboard", content: "Here's a quick overview." },
    { id: "team-management", target: "#team-settings", title: "Manage your team", content: "Invite members and assign roles.", when: () => ctx.role === "org:admin" },
    { id: "billing", target: "#billing-section", title: "Billing and subscription", content: "View invoices and manage your plan.", when: () => ctx.hasPermission("org:billing:manage") },
    { id: "create-task", target: "#new-task-btn", title: "Create your first task", content: "Click here to create a task.", when: () => ctx.role === "org:member" },
    { id: "analytics", target: "#analytics-panel", title: "Your analytics dashboard", content: "Track team performance.", when: () => ctx.role === "org:admin" || ctx.hasPermission("org:analytics:read") },
  ];
}
```

## Step 3: wire it together

```tsx
// src/hooks/use-role-tour.ts
import { useTour } from "@tourkit/react";
import { useClerkRole } from "./use-clerk-role";
import { getDashboardSteps } from "../tours/dashboard-tour";
import { useMemo } from "react";

export function useRoleTour(tourId: string) {
  const { role, isLoaded, userId, hasPermission } = useClerkRole();
  const steps = useMemo(() => getDashboardSteps({ role, hasPermission }), [role, hasPermission]);
  const tour = useTour({ tourId, steps, enabled: isLoaded && !!userId });
  return tour;
}
```

## Step 4: render the tour

```tsx
// src/app/dashboard/layout.tsx
"use client";
import { useRoleTour } from "@/hooks/use-role-tour";
import { TourProvider, TourOverlay, TourTooltip } from "@tourkit/react";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const tour = useRoleTour("dashboard-onboarding");
  return (
    <TourProvider tour={tour}>
      {children}
      <TourOverlay />
      <TourTooltip />
    </TourProvider>
  );
}
```

Full article with extended sections on persistence, Role Sets, lazy-loading, and accessibility: [usertourkit.com/blog/tour-kit-clerk-role-based-tours](https://usertourkit.com/blog/tour-kit-clerk-role-based-tours)

---

**Get started with Tour Kit:** `npm install @tourkit/core @tourkit/react` | [GitHub](https://github.com/AmanVarshney01/tour-kit) | [Docs](https://usertourkit.com/)
