# How to build role-based onboarding for multi-tenant SaaS apps

*Your admin and your viewer shouldn't see the same product tour.*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)*

Your project management SaaS has three roles: workspace owner, team lead, and contributor. The owner needs to configure billing and invite members. The contributor needs to create their first task. Showing both users the same 12-step product tour wastes everyone's time.

As of April 2026, personalized onboarding flows achieve 65% higher completion rates than generic ones. And 59% of SaaS buyers regret at least one purchase in the last 18 months, with adoption failures cited as a primary driver (Gartner, 2025). The onboarding experience that greets each user role is often the difference between a retained customer and a churned one.

## The problem with generic tours

Generic tours create three problems in multi-tenant products.

First, permission mismatches. A viewer gets walked to the "Invite Team Members" button. They click it. Nothing happens because they don't have permission. The user now trusts your product less than before the tour started.

Second, cognitive overload. Research shows people hold 5-7 items in working memory at once. A 15-step tour that covers every role burns through that limit by step 6.

Third, tenant configuration gaps. Enterprise tenants with SSO don't need password setup steps. Free-tier tenants without analytics don't need dashboard widget steps. Generic tours can't account for what's actually available.

Role-based personalization lifts 7-day retention by 35% compared to generic flows.

## Two dimensions of segmentation

Tour segmentation in multi-tenant apps operates on two axes:

**User role within the organization.** Admins need 8-12 setup steps. Contributors need 4-6 daily task steps. Viewers need 3-4 navigation steps.

**Tenant plan and configuration.** The same "admin" role behaves differently on free vs. enterprise. Enterprise admins see SSO and audit logs. Free admins see upgrade prompts.

## The architecture pattern

The approach: wrap your existing tenant context provider around the tour system, passing role, permissions, and plan tier into each tour step's conditional function. Steps that don't match the current user's context are skipped entirely at render time.

This means a single tour definition handles all roles. No separate tour files per role. No conditional imports. Just one step array where each step declares which permissions or plan tiers it requires.

A viewer ends up seeing 3 steps. An enterprise admin with full permissions sees all 7. The step counter adjusts automatically.

## Key mistakes to avoid

**Checking roles instead of permissions.** "Admin" in Tenant A might have billing access while "Admin" in Tenant B does not. Check specific permissions, not role names.

**Storing completion state globally.** A user who completes onboarding in one workspace shouldn't see it marked complete in another workspace where they have a different role.

**Ignoring the plan dimension.** An admin on free and an admin on enterprise need different tours because they have access to different features.

**Overloading the first session.** Even a well-segmented admin tour shouldn't be 15 steps. Cap at 5-7 and use progressive disclosure for advanced features.

## Measuring success

Track completion rate, step drop-off, and feature activation — all segmented by role. Your overall 55% completion rate might mask that admins complete at 78% while viewers abandon at 31%.

Research shows segmented completion analysis reveals 15-30% performance variations between user groups. If you're not segmenting, you're improving the wrong flows.

---

Full article with TypeScript code examples, analytics integration patterns, and accessibility guidance: [usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
