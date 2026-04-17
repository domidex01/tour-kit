## Title: Role-based onboarding for multi-tenant SaaS: permission-aware tour patterns in React

## URL: https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours

## Comment to post immediately after:

We've been building onboarding flows for a multi-tenant B2B dashboard where the same user can be an admin in one workspace and a viewer in another. Generic tours failed badly — viewers getting walked to buttons they couldn't click, admins drowning in 15-step flows on day one.

The key insight was checking granular permissions (billing.manage, team.invite) rather than role names. "Admin" means different things in different tenants when customers can customize role definitions. Scoping tour completion state to tenantId + userId + tourId solved the cross-workspace contamination problem.

Some numbers that informed our approach: personalized flows see 65% higher completion rates than generic (Monetizely research); segmented analytics revealed 15-30% variation between user groups we'd been averaging together; 7-day retention lifted ~35% after segmenting (DesignRevision data).

The architecture uses a single tour definition with conditional step functions. Steps that don't match skip entirely — no DOM queries, no phantom tooltips. The tradeoff is that this requires React 18+ and developer implementation (no visual builder). Article has full TypeScript code examples.
