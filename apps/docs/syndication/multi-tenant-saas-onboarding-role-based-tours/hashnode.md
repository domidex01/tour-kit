---
title: "Onboarding for multi-tenant SaaS: role-based tour strategies"
slug: "multi-tenant-saas-onboarding-role-based-tours"
canonical: https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours
tags: react, typescript, web-development, saas
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)*

# Onboarding for multi-tenant SaaS: role-based tour strategies

Your project management SaaS has three roles: workspace owner, team lead, and contributor. The owner needs to configure billing and invite members. The contributor needs to create their first task. Showing both the same 12-step product tour wastes everyone's time and teaches the contributor about buttons they can't even see.

As of April 2026, personalized onboarding flows achieve 65% higher completion rates than generic ones ([Monetizely, 2026](https://www.getmonetizely.com/articles/how-to-measure-onboarding-completion-rates-a-strategic-guide-for-saas-executives)). And 59% of SaaS buyers regret at least one purchase in the last 18 months, with adoption failures cited as a primary driver ([Gartner, 2025 via Litmos](https://www.litmos.com/blog/articles/top-saas-onboarding-trends)).

This guide covers architecture and implementation patterns for building role-aware product tours in a multi-tenant React app, using Tour Kit's `when` prop and context system.

```bash
npm install @tourkit/core @tourkit/react
```

## Why role-based onboarding matters

Generic tours create three problems in multi-tenant products: permission mismatches (viewers guided to buttons they can't click), cognitive overload (15-step tours when viewers need 4), and tenant configuration gaps (showing SSO setup on free plans that don't have it).

Role-based personalization lifts 7-day retention by 35% compared to generic flows ([DesignRevision, 2026](https://designrevision.com/blog/saas-onboarding-best-practices)).

## Architecture: bridging tenant context and tour context

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

## Permission-aware steps with the `when` prop

Check permissions instead of roles directly. A user might be "admin" in one workspace but that admin role might not include billing access ([Bitsrc, 2024](https://blog.bitsrc.io/designing-implementing-access-control-in-react-34eb8bc67511)).

```tsx
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
      target: '#invite-button',
      title: 'Invite your team',
      content: 'Add team members and assign them roles.',
      when: (ctx) => ctx.permissions.includes('team.invite'),
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

Tour Kit's `when` prop evaluates at render time. When it returns `false`, the step is skipped entirely. No DOM query, no tooltip, no wasted render.

## Tenant-scoped storage

Tour completion must be scoped to both user and tenant. Use the key pattern `tour:${tenantId}:${userId}:${tourId}` and store server-side for production.

## Common mistakes

1. Checking roles instead of permissions
2. Storing completion state globally (not per-tenant)
3. Ignoring tenant plan dimension
4. Overloading the first session (cap at 5-7 steps per role)

---

Full article with analytics integration, accessibility guidance, and more code examples: [usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours](https://usertourkit.com/blog/multi-tenant-saas-onboarding-role-based-tours)
