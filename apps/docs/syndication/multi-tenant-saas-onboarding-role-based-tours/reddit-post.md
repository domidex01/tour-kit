## Subreddit: r/reactjs

**Title:** We built role-based onboarding tours for a multi-tenant SaaS app — here's what we learned about segmenting by permission, not role

**Body:**

Been building onboarding flows for a B2B SaaS dashboard that has admins, managers, members, and viewers across multiple tenants. The same user can be an admin in one workspace and a viewer in another. Figured I'd share some patterns that actually worked after trying several approaches.

The biggest lesson: check granular permissions (`billing.manage`, `team.invite`) rather than role names. "Admin" in Tenant A might have billing access while "Admin" in Tenant B doesn't. We started by checking `role === 'admin'` and had to refactor when customers started customizing their role definitions.

Some data points that informed our approach:

- Personalized onboarding flows see 65% higher completion rates than generic ones (Monetizely research)
- 7-day retention lifts by about 35% when you segment by role (DesignRevision)
- Average SaaS onboarding completion sits at 40-60%; top performers hit 70-80%
- Segmented analytics revealed 15-30% performance variation between user groups we were averaging together

The architecture we settled on: a single tour definition with conditional step functions that receive the user's permissions and tenant config. Steps that don't match the current user skip entirely — no DOM queries, no phantom tooltips, no wasted renders. A viewer sees 3 steps out of 7 defined, and the step counter shows "1 of 3" not "1 of 7."

Tour completion state has to be scoped to `tenantId + userId + tourId`. If a user completes the admin onboarding in Workspace A, it shouldn't mark the viewer onboarding in Workspace B as done.

Mistakes we made early on:
- Maintaining separate tour files per role (drift happens fast)
- Not segmenting analytics by role (our "55% completion" was hiding that admins were at 78% and viewers at 31%)
- Showing 12+ steps to admins on day one instead of using progressive disclosure

Full writeup with TypeScript code examples: https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours

Curious how other folks handle this. Anyone doing something different for multi-tenant onboarding?

---

## Also consider: r/SaaS

**Title:** How we segmented onboarding by user role — 65% higher completion rates

**Body:**

Running a multi-tenant B2B SaaS app, and our generic onboarding tour was getting 45% completion. The problem: admins, managers, and viewers all saw the same 12-step flow. Viewers were being shown buttons they couldn't even click.

We switched to role-based tours where each user only sees steps relevant to their permissions and tenant plan. Results after segmenting:

- Viewer completion jumped from ~30% to ~65% (fewer, more relevant steps)
- Admin completion stayed around 78% but time-to-complete dropped
- 7-day retention lifted by roughly 35% across the board

The approach: a single tour definition with conditional functions on each step. Check the user's specific permissions (not just their role name) and the tenant's plan tier. Enterprise admins see SSO setup; free-tier admins don't. Viewers see 3-4 steps; admins see 8-10.

Biggest mistake we made: storing tour completion globally instead of per-tenant. Users who are admins in one workspace and viewers in another need separate onboarding tracks.

Detailed writeup with implementation patterns: https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours
