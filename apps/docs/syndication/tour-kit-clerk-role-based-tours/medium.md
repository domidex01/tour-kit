# How to Build Role-Based Product Tours with Clerk Authentication

## Show admins one tour, members another — using hooks you already have

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-clerk-role-based-tours)*

Your admin needs a tour of billing settings, team management, and API keys. Your member needs a tour of the dashboard, task creation, and notifications. Showing both the same 12-step walkthrough wastes everyone's time.

Clerk gives you the auth context. Tour Kit gives you the tour engine. The connection between them is about 30 lines of TypeScript. As of April 2026, Clerk's free tier covers 50,000 monthly active users, and Tour Kit's core ships at under 8KB gzipped. That's a role-based onboarding system for $0 at most startup scales.

## The cost comparison

Before diving into code, here's why this combination makes financial sense:

- **Clerk + Tour Kit** at 40K MAU: $0/month total
- **Auth0 + React Joyride**: ~$2,275/month (Auth0 alone)
- **Clerk + Appcues**: ~$300/month (Appcues)
- **WalkMe enterprise**: ~$15,000+/year

## Step 1: Extract roles from Clerk

Clerk's `useOrganization()` hook returns the current user's membership, including their role string and permissions array. Wrap it in a custom hook:

```
// src/hooks/use-clerk-role.ts
import { useOrganization, useUser } from "@clerk/nextjs";

export function useClerkRole() {
  const { membership, isLoaded: orgLoaded } = useOrganization();
  const { user, isLoaded: userLoaded } = useUser();

  return {
    role: membership?.role ?? "org:member",
    isLoaded: orgLoaded && userLoaded,
    userId: user?.id ?? null,
    hasPermission: (p) =>
      membership?.permissions?.includes(p) ?? false,
  };
}
```

Important gotcha: Clerk's 8 system permissions are NOT included in session claims. Use custom permissions for tour step gating.

## Step 2: Define conditional tour steps

Tour Kit's `when` prop accepts a function returning true or false. Steps returning false are skipped entirely:

```
export function getDashboardSteps(ctx) {
  return [
    { id: "welcome", target: "#dashboard-header",
      title: "Welcome to your dashboard" },
    { id: "team-management", target: "#team-settings",
      title: "Manage your team",
      when: () => ctx.role === "org:admin" },
    { id: "billing", target: "#billing-section",
      title: "Billing and subscription",
      when: () => ctx.hasPermission("org:billing:manage") },
    { id: "create-task", target: "#new-task-btn",
      title: "Create your first task",
      when: () => ctx.role === "org:member" },
  ];
}
```

The welcome step has no `when` prop — everyone sees it. The billing step uses permission-based filtering instead of role names, which is more future-proof.

## Step 3: Connect the pieces

One hook combines Clerk's auth state with Tour Kit's tour engine:

```
export function useRoleTour(tourId) {
  const { role, isLoaded, userId, hasPermission } = useClerkRole();
  const steps = useMemo(
    () => getDashboardSteps({ role, hasPermission }),
    [role, hasPermission]
  );
  return useTour({ tourId, steps, enabled: isLoaded && !!userId });
}
```

The `enabled` flag prevents the tour from rendering before Clerk finishes loading. No flash of incorrect content.

## Going further

The full article covers four additional patterns:

1. **Persisting tour completion** in Clerk's `publicMetadata` (avoiding a separate database)
2. **Role Sets** (shipped January 2026) for tiered onboarding — free orgs get basic tours, Pro orgs get advanced ones
3. **Lazy-loading** the tour component after auth resolves, keeping First Contentful Paint clean
4. **Accessibility** — Tour Kit automatically re-indexes filtered steps so screen readers hear correct counts

## Limitations

Tour Kit requires React 18+ and has no visual builder. Clerk's Organizations feature requires users to be part of an organization. And Clerk caps custom roles at 10 per app instance.

Read the full tutorial with complete TypeScript code, comparison tables, and FAQ: [usertourkit.com/blog/tour-kit-clerk-role-based-tours](https://usertourkit.com/blog/tour-kit-clerk-role-based-tours)

---

*Suggested Medium publications to submit to: JavaScript in Plain English, Better Programming, Level Up Coding*
