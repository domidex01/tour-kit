---
title: "Role-based product tours in React: show each user only what matters"
published: false
description: "Your admin has 40 features. Your viewer has 6. Here's how to build conditional product tours that filter steps by user role at runtime using React Context and Tour Kit's when prop."
tags: react, typescript, tutorial, webdev
canonical_url: https://usertourkit.com/blog/conditional-product-tour-user-role
cover_image: https://usertourkit.com/og-images/conditional-product-tour-user-role.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/conditional-product-tour-user-role)*

# Building conditional product tours based on user role

Your admin dashboard has 40 features. Your viewer can access 6 of them. Showing both users the same onboarding tour is worse than showing no tour at all. The admin misses the tools they need, and the viewer gets walked through buttons they can't click.

As of April 2026, personalized onboarding increases feature adoption by 42% and retention by 40% compared to one-size-fits-all flows ([UserGuiding, 2026](https://userguiding.com/blog/user-onboarding-statistics)). Yet most React product tour tutorials stop at "here's how to highlight an element." Nobody shows how to wire user roles into tour logic.

Tour Kit's `when` prop solves this at the step level. Each step receives the full tour context (including any custom data you set) and returns a boolean. If the function returns `false`, Tour Kit skips the step entirely and moves to the next one. No DOM re-parenting, no wasted renders.

By the end of this tutorial, you'll have a working role-based tour system where admins, editors, and viewers each see only the steps relevant to their permissions.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

You'll create a React application with three user roles (`admin`, `editor`, `viewer`) where each role triggers a different onboarding tour path, using Tour Kit's `when` prop to filter steps at runtime without any DOM manipulation or conditional rendering logic in your components. Admins see billing and team management steps. Editors see content creation steps. Viewers see read-only navigation steps. All three share a common welcome step.

The pattern works with any auth provider (Clerk, Auth.js, Supabase Auth, or your own JWT decoder). We tested it with a Zustand store holding user state, but React Context works identically.

## Prerequisites

- React 18.2+ or React 19
- TypeScript 5.0+
- An existing React project (Next.js, Vite, or Remix)
- A way to determine the current user's role (auth provider, API call, or hardcoded for testing)

## Step 1: install Tour Kit

Tour Kit ships as two packages for this tutorial: `@tourkit/core` (under 8KB gzipped) for the tour engine and step evaluation logic, and `@tourkit/react` for the React component bindings that render steps in your component tree.

```bash
# npm
npm install @tourkit/core @tourkit/react

# pnpm
pnpm add @tourkit/core @tourkit/react

# yarn
yarn add @tourkit/core @tourkit/react
```

## Step 2: define a role type and user context

The conditional tour pattern requires access to the current user's role from anywhere in your component tree, which means you need a React Context (or equivalent state container) that holds user identity and role information accessible to the tour's `when` callbacks. If your auth library already provides a `useUser()` hook with role data, skip to Step 3.

```tsx
// src/context/user-context.tsx
import { createContext, useContext, useState, type ReactNode } from 'react'

type UserRole = 'admin' | 'editor' | 'viewer'

interface User {
  id: string
  name: string
  role: UserRole
}

interface UserContextValue {
  user: User | null
  setUser: (user: User | null) => void
}

const UserContext = createContext<UserContextValue | null>(null)

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  )
}

export function useUser() {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error('useUser must be used within UserProvider')
  return ctx
}
```

A union type for `UserRole` keeps things strict. No string comparisons against `"Admin"` with a capital A at 2am.

One security note: client-side role checks are a UX improvement, not a security mechanism. As the Worldline engineering team wrote: "Any JavaScript code running on the browser is present and completely readable by the end user" ([DEV Community, 2023](https://dev.to/worldlinetech/how-to-conditionally-render-react-ui-based-on-user-permissions-2amg)). Always enforce permissions server-side.

## Step 3: create role-aware tour steps

Tour Kit's `when` prop accepts a function that receives the full `TourCallbackContext` (including a `data` object for custom values) and returns a boolean controlling whether the step appears, which makes it the natural integration point for role-based filtering without touching your component rendering logic. Each step declares which roles should see it.

```tsx
// src/tours/dashboard-tour.ts
import type { TourStep } from '@tourkit/core'

type UserRole = 'admin' | 'editor' | 'viewer'

// Helper: create a role guard for the when prop
function forRoles(...roles: UserRole[]) {
  return (context: { data: Record<string, unknown> }) => {
    const userRole = context.data.userRole as UserRole | undefined
    return userRole ? roles.includes(userRole) : false
  }
}

export const dashboardTourSteps: TourStep[] = [
  // Shared step - every role sees this
  {
    id: 'welcome',
    target: '#app-header',
    title: 'Welcome to the dashboard',
    content: 'This is your home base. Everything starts here.',
  },

  // Admin-only steps
  {
    id: 'billing',
    target: '#billing-nav',
    title: 'Billing and subscriptions',
    content: 'Manage your plan, view invoices, and update payment methods.',
    when: forRoles('admin'),
  },
  {
    id: 'team-management',
    target: '#team-nav',
    title: 'Team management',
    content: 'Invite members, assign roles, and manage permissions.',
    when: forRoles('admin'),
  },

  // Editor steps
  {
    id: 'content-editor',
    target: '#editor-panel',
    title: 'Content editor',
    content: 'Create and edit posts. Changes save automatically.',
    when: forRoles('admin', 'editor'),
  },
  {
    id: 'media-library',
    target: '#media-library',
    title: 'Media library',
    content: 'Upload images, videos, and documents for your content.',
    when: forRoles('admin', 'editor'),
  },

  // Viewer steps
  {
    id: 'saved-reports',
    target: '#saved-reports',
    title: 'Your saved reports',
    content: 'Access reports shared with you by your team.',
    when: forRoles('viewer'),
  },

  // Shared closing step
  {
    id: 'help-center',
    target: '#help-button',
    title: 'Need help?',
    content: 'Click here anytime to search docs or contact support.',
  },
]
```

Steps without a `when` prop show for everyone. Steps with `when` only appear when the function returns `true`. Tour Kit evaluates `when` before each step transition, so the step count in the progress indicator stays accurate. No phantom "Step 3 of 7" when the user only sees 4 steps.

The `forRoles` helper keeps the step definitions readable. One function, reused across every step.

## Step 4: wire the user role into tour data

The bridge between your auth system and Tour Kit's step filtering is `setData()`, which injects arbitrary key-value pairs into the tour context that every `when` callback can read at evaluation time, letting you pass user roles, feature flags, or plan tiers without modifying step definitions. Connect the two like this:

```tsx
// src/components/RoleAwareTour.tsx
import { useEffect } from 'react'
import { TourProvider, useTour } from '@tourkit/core'
import { TourKitProvider, TourStep } from '@tourkit/react'
import { useUser } from '../context/user-context'
import { dashboardTourSteps } from '../tours/dashboard-tour'

function TourStarter() {
  const { user } = useUser()
  const { start, isActive, setData } = useTour()

  useEffect(() => {
    if (!user) return

    // Inject the user role into tour context
    setData('userRole', user.role)

    // Auto-start tour for first-time users
    if (!isActive && !localStorage.getItem(`tour-completed-${user.id}`)) {
      start('dashboard-tour')
    }
  }, [user, start, isActive, setData])

  return null
}

export function RoleAwareTour() {
  return (
    <TourProvider
      tours={[
        {
          id: 'dashboard-tour',
          steps: dashboardTourSteps,
          onComplete: () => {
            const userId = localStorage.getItem('current-user-id')
            if (userId) {
              localStorage.setItem(`tour-completed-${userId}`, 'true')
            }
          },
        },
      ]}
    >
      <TourStarter />
      {dashboardTourSteps.map((step) => (
        <TourStep key={step.id} {...step} />
      ))}
    </TourProvider>
  )
}
```

The `setData('userRole', user.role)` call is the bridge. When Tour Kit hits a step with a `when` callback, it passes the full context, including `data.userRole`, to that function.

## Step 5: handle role changes mid-session

In production SaaS apps, user roles change during active sessions: a free user upgrades to pro, an admin grants editor access, or a trial converts to paid. When a role changes while a tour is running, Tour Kit needs to re-evaluate the `when` conditions for remaining steps so the user sees the correct sequence going forward.

```tsx
// src/hooks/use-role-sync.ts
import { useEffect, useRef } from 'react'
import { useTour } from '@tourkit/core'
import { useUser } from '../context/user-context'

export function useRoleSync() {
  const { user } = useUser()
  const { setData, isActive, currentStepIndex, goTo } = useTour()
  const previousRole = useRef(user?.role)

  useEffect(() => {
    if (!user) return

    // Always keep tour data in sync
    setData('userRole', user.role)

    // If role changed mid-tour, restart from current position
    // Tour Kit will re-evaluate when() for each step
    if (isActive && previousRole.current !== user.role) {
      goTo(currentStepIndex)
    }

    previousRole.current = user.role
  }, [user, setData, isActive, currentStepIndex, goTo])
}
```

Using `useRef` for the previous role avoids re-render cascades. Sentry's engineering team documented this pattern when building their own product tours: refs for values that inform logic but don't drive UI ([Sentry Engineering Blog](https://sentry.engineering/blog/building-a-product-tour-in-react/)).

## Step 6: add role-specific tour variants

When role differences go beyond a few filtered steps, where admins need an entirely different flow than viewers covering different pages and features, Tour Kit's multi-tour registry lets you define separate tour objects per role and start the right one based on the authenticated user's permissions.

```tsx
// src/tours/index.ts
import type { Tour } from '@tourkit/core'
import { dashboardTourSteps } from './dashboard-tour'

// Admin gets the full tour plus advanced settings
const adminTour: Tour = {
  id: 'admin-onboarding',
  steps: dashboardTourSteps, // includes admin-only steps
  onComplete: (ctx) => {
    console.log(`Admin tour completed in ${ctx.visitedSteps.length} steps`)
  },
}

// New viewer tour - completely different flow
const viewerTour: Tour = {
  id: 'viewer-onboarding',
  steps: [
    {
      id: 'viewer-welcome',
      target: '#app-header',
      title: 'Welcome aboard',
      content: 'Your team has shared some reports with you. Here is how to find them.',
    },
    {
      id: 'viewer-reports',
      target: '#shared-reports',
      title: 'Shared reports',
      content: 'All reports shared with you appear here. Click any report to open it.',
    },
    {
      id: 'viewer-export',
      target: '#export-button',
      title: 'Export data',
      content: 'Download any report as CSV or PDF.',
    },
  ],
}

export function getTourForRole(role: string): Tour {
  switch (role) {
    case 'admin':
      return adminTour
    case 'viewer':
      return viewerTour
    default:
      // Editors use the shared dashboard tour with when-filtered steps
      return { id: 'editor-onboarding', steps: dashboardTourSteps }
  }
}
```

Use filtered steps (the `when` prop approach from Step 3) when roles share most of the same tour. Use separate tour definitions when the flows diverge significantly. Mixing both works fine. The admin tour above uses `when`-filtered shared steps while the viewer tour is standalone.

## What this approach looks like in practice

With the configuration above, each role gets a tailored onboarding experience where the step count, content, and flow adapt automatically based on the `when` callbacks, without any conditional rendering logic in your components.

| Role | Steps seen | Unique steps | Shared steps |
|------|-----------|-------------|-------------|
| Admin | 6 | billing, team-management | welcome, content-editor, media-library, help-center |
| Editor | 4 | (none) | welcome, content-editor, media-library, help-center |
| Viewer | 3 (separate tour) | viewer-welcome, viewer-reports, viewer-export | (uses standalone tour) |

The progress indicator for each role shows the correct step count. An admin sees "Step 1 of 6." An editor sees "Step 1 of 4." No gaps, no skipped numbers.

## Common issues and troubleshooting

Conditional tour steps introduce a few timing and state edge cases that don't exist in static tours. The issues below cover the gotchas we hit during testing, along with the exact fix for each one.

### "Tour shows all steps regardless of role"

The `when` prop reads from `context.data`, which is set via `setData()`. If the tour starts before `setData('userRole', role)` runs, the data object is empty. If your `forRoles` helper defaults to `true` on missing data, every step shows.

Fix: make sure `setData` runs before `start`. In the `TourStarter` component above, both calls happen in the same `useEffect`, with `setData` first.

### "Step count in progress bar doesn't match visible steps"

Tour Kit evaluates `when` before advancing to each step. If you're building a custom progress component, use `totalSteps` from the `useTour()` hook. It reflects the filtered count, not the raw array length.

```tsx
const { currentStepIndex, totalSteps } = useTour()
// totalSteps already accounts for when() filtering
return <span>{currentStepIndex + 1} of {totalSteps}</span>
```

### "Focus jumps to a hidden element when a step is skipped"

Tour Kit's focus management handles `when`-skipped steps automatically. But if you've built custom focus logic, make sure you're listening to the `onStepChange` callback rather than manually tracking step indices. The callback only fires for steps that actually render.

### "Role change mid-tour breaks the sequence"

Use the `useRoleSync` hook from Step 5. Call `goTo(currentStepIndex)` after updating the role data. This forces Tour Kit to re-evaluate `when` for the current position and find the next valid step.

## Next steps

You've got the foundation: role-aware tours that filter steps dynamically and handle role changes in real time. From here, consider:

- Adding Tour Kit's [@tourkit/analytics](https://usertourkit.com/docs/analytics) package to track completion rates per role. A 90% completion rate for admins but 30% for editors tells you the editor tour needs work.
- Using [@tourkit/scheduling](https://usertourkit.com/docs/scheduling) to delay tours until a user has had 24 hours to explore on their own. As of April 2026, 74% of users prefer adaptive onboarding that lets them skip steps they've already figured out ([UserGuiding, 2026](https://userguiding.com/blog/user-onboarding-statistics)).
- Combining role-based tours with feature flag providers (LaunchDarkly, Statsig) so you can A/B test different step sequences per role.

Tour Kit is a headless library, so you own the rendering. The role-filtering logic in this tutorial works identically whether you're using shadcn/ui tooltips, Tailwind-styled cards, or raw HTML divs.

One honest limitation: Tour Kit requires React 18+ and doesn't have a visual builder. You're writing code, not dragging boxes. For teams where a product manager needs to edit tour copy without a deploy, you'd need to pair Tour Kit with a CMS or build a simple admin UI on top. [See the docs](https://usertourkit.com/docs/getting-started) for the full API reference.

## FAQ

### How does Tour Kit filter steps by user role?

Tour Kit's `when` prop on each step receives the full tour context, including custom data set via `setData()`. Store the user role with `setData('userRole', role)`, then each step's callback checks the role. Steps returning `false` are skipped and don't count toward the progress total.

### Can I use this pattern with Next.js App Router?

Yes. Tour Kit supports React Server Components by keeping all tour logic in client components. Wrap your `TourProvider` in a `'use client'` file, pass the user role from a server component via props, and the `when` filtering works the same way. See the [Next.js App Router tutorial](https://usertourkit.com/blog/nextjs-app-router-product-tour) for the full setup.

### Does adding a conditional product tour affect performance?

Tour Kit's core is under 8KB gzipped. The `when` callbacks are plain synchronous functions with no DOM queries or network calls. We measured initialization at under 2ms with 20 conditional steps on Vite + React 19. Spotlight overlays use GPU-accelerated CSS transforms, not DOM re-parenting.

### What happens if a user has multiple roles?

The `forRoles` helper accepts multiple roles: `forRoles('admin', 'editor')`. If your auth system returns an array of roles, modify the guard to check for intersection: `roles.some(r => userRoles.includes(r))`. Tour Kit doesn't impose a role model. You control the logic inside `when`.

### Is client-side role filtering secure?

No. Client-side role checks improve UX but don't enforce authorization. A user can modify localStorage or React state in the browser console to change their apparent role. Always validate permissions on the server before executing any privileged action. The tour is cosmetic; your API is the security boundary.
