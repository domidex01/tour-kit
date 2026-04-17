---
title: "Role-based onboarding for multi-tenant SaaS in React"
published: false
description: "Your admin and your viewer shouldn't see the same product tour. Here's how to build permission-aware, tenant-scoped onboarding tours in React with code examples."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours
cover_image: https://usertourkit.com/og-images/multi-tenant-saas-onboarding-role-based-tours.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)*

# Onboarding for multi-tenant SaaS: role-based tour strategies

Your project management SaaS has three roles: workspace owner, team lead, and contributor. The owner needs to configure billing and invite members. The contributor needs to create their first task. Showing both the same 12-step product tour wastes everyone's time and teaches the contributor about buttons they can't even see.

As of April 2026, personalized onboarding flows achieve 65% higher completion rates than generic ones ([Monetizely, 2026](https://www.getmonetizely.com/articles/how-to-measure-onboarding-completion-rates-a-strategic-guide-for-saas-executives)). And 59% of SaaS buyers regret at least one purchase in the last 18 months, with adoption failures cited as a primary driver ([Gartner, 2025 via Litmos](https://www.litmos.com/blog/articles/top-saas-onboarding-trends)). The onboarding experience that greets each user role is often the difference between a retained customer and a churned one.

This guide covers the architecture and implementation patterns for building role-aware product tours in a multi-tenant React app. The examples use Tour Kit's `when` prop and context system, but the patterns apply to any tour library that supports conditional rendering.

```bash
npm install @tourkit/core @tourkit/react
```

## Why role-based onboarding matters

Generic tours create three specific problems in multi-tenant products:

**The permission mismatch.** A viewer gets walked to the "Invite Team Members" button. They click it. Nothing happens because they don't have permission. That's worse than no tour at all.

**The cognitive overload.** People hold 5-7 items in working memory at once ([Smashing Magazine, 2023](https://www.smashingmagazine.com/2023/04/design-effective-user-onboarding-flow/)). A 15-step tour that covers admin, editor, and viewer features burns through that limit by step 6.

**The tenant configuration gap.** Enterprise tenants with SSO enabled don't need a tour step about password setup. Free-tier tenants without the analytics module don't need a step about dashboard widgets.

Role-based personalization lifts 7-day retention by 35% compared to generic flows ([DesignRevision, 2026](https://designrevision.com/blog/saas-onboarding-best-practices)).

## The two dimensions of segmentation

Multi-tenant tour segmentation operates on two axes:

**Dimension 1: User role.** Most B2B SaaS products define 3-5 roles. Owner/admin tours focus on setup (8-12 steps). Contributor tours focus on daily tasks (4-6 steps). Viewer tours cover navigation only (3-4 steps).

**Dimension 2: Tenant plan.** The same "admin" role behaves differently on a free plan versus an enterprise plan. Enterprise admins see SSO configuration and audit logs. Free-tier admins see upgrade prompts.

## Architecture: tenant context meets tour context

```tsx
// src/providers/tenant-tour-provider.tsx
import { TourProvider } from '@tourkit/react';
import { useTenant } from './tenant-context';
import { useAuth } from './auth-context';
import { getTourSteps } from '../tours/registry';

export function TenantTourProvider({ children }: { children: React.ReactNode }) {
  const { tenant } = useTenant();
  const { user, membership } = useAuth();

  const tourContext = {
    role: membership.role,
    permissions: membership.permissions,
    plan: tenant.plan,
    features: tenant.featureFlags,
    tenantId: tenant.id,
  };

  return (
    <TourProvider
      tourId="onboarding"
      steps={getTourSteps()}
      context={tourContext}
    >
      {children}
    </TourProvider>
  );
}
```

## Permission-aware steps

Check permissions instead of roles directly. Roles change across organizations ([Bitsrc, 2024](https://blog.bitsrc.io/designing-implementing-access-control-in-react-34eb8bc67511)).

```tsx
// src/tours/registry.ts
import type { TourStep } from '@tourkit/core';

interface OnboardingContext {
  role: string;
  permissions: string[];
  plan: string;
  features: Record<string, boolean>;
  tenantId: string;
}

export function getTourSteps(): TourStep<OnboardingContext>[] {
  return [
    {
      target: '#dashboard-header',
      title: 'Welcome to your workspace',
      content: 'Here is a quick tour of the features available to you.',
    },
    {
      target: '#billing-nav',
      title: 'Manage your subscription',
      content: 'View invoices, update payment methods, and manage your plan.',
      when: (ctx) => ctx.permissions.includes('billing.manage'),
    },
    {
      target: '#sso-settings',
      title: 'Single sign-on is active',
      content: 'Your team signs in through your identity provider.',
      when: (ctx) =>
        ctx.features.sso && ctx.permissions.includes('security.manage'),
    },
    {
      target: '#invite-button',
      title: 'Invite your team',
      content: 'Add team members and assign them roles.',
      when: (ctx) => ctx.permissions.includes('team.invite'),
    },
    {
      target: '#create-button',
      title: 'Create your first item',
      content: 'Click here to get started with your first project.',
      when: (ctx) => ctx.role !== 'viewer',
    },
    {
      target: '#analytics-tab',
      title: 'Track your progress',
      content: 'View team performance metrics and trends.',
      when: (ctx) =>
        ['pro', 'enterprise'].includes(ctx.plan) &&
        ctx.permissions.includes('analytics.view'),
    },
    {
      target: '#help-menu',
      title: 'Need help?',
      content: 'Access docs, support, and keyboard shortcuts here.',
    },
  ];
}
```

A viewer sees 3 steps (welcome, help, and whatever else they qualify for). An enterprise admin with full permissions sees all 7.

## Tenant-scoped storage

Tour completion state must be scoped to both user and tenant:

```tsx
function getTourStorageKey(tourId: string, userId: string, tenantId: string) {
  return `tour:${tenantId}:${userId}:${tourId}`;
}
```

For production apps, store this server-side (keyed by `org_id + user_id + tour_id`).

## Common mistakes to avoid

1. **Checking roles instead of permissions.** "Admin" in Tenant A might have billing access while "Admin" in Tenant B does not. Check `permissions.includes('billing.manage')`, not `role === 'admin'`.
2. **Storing completion state globally.** Scope to `tenantId + userId + tourId`.
3. **Ignoring the tenant plan dimension.** An admin on free and an admin on enterprise need different tours.
4. **Overloading the first session.** Cap at 5-7 steps per role; defer advanced features to progressive disclosure.

---

Full article with all code examples, analytics integration patterns, and accessibility details: [usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)
