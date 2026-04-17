## Thread (6 tweets)

**1/** Your multi-tenant SaaS has admins, managers, and viewers. Showing them all the same product tour is worse than showing no tour at all.

Personalized onboarding flows see 65% higher completion rates. Here's how to build role-based tours in React: 🧵

**2/** The biggest mistake: checking role names instead of permissions.

"Admin" in Tenant A might have billing access. "Admin" in Tenant B might not.

Check `permissions.includes('billing.manage')`, not `role === 'admin'`.

Roles are tenant-scoped. Permissions are the source of truth.

**3/** Two dimensions matter for tour segmentation:

1. User role → what can this person do?
2. Tenant plan → what has this org enabled?

An admin on free and an admin on enterprise need different tours. Enterprise sees SSO setup. Free sees upgrade prompts.

**4/** Tour completion state must be scoped to tenantId + userId + tourId.

Why? The same person can be admin in Workspace A and viewer in Workspace B.

Completing the admin tour in A shouldn't mark the viewer tour in B as done.

**5/** Numbers after we segmented by role:

- Viewer tours: 3-4 steps instead of 12
- Admin completion: 78% (was hidden in a 55% average)
- Viewer completion: jumped from ~30% to ~65%
- 7-day retention: +35% vs generic flows

Segmented analytics revealed 15-30% variation between user groups.

**6/** Full guide with TypeScript code examples, analytics integration, and accessibility patterns for conditionally filtered tours:

https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours
