---
title: "What is user activation rate? (and how product tours improve it)"
slug: "what-is-user-activation-rate"
canonical: https://usertourkit.com/blog/what-is-user-activation-rate
tags: react, javascript, web-development, saas, product-management
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-user-activation-rate)*

# What is user activation rate? (and how product tours improve it)

Your signup numbers look great. Hundreds of new users per week. But 64% of them never reach the moment where your product clicks.

That gap between "signed up" and "got value" is your activation rate. And it's the single metric most correlated with long-term retention.

The average SaaS activation rate sits at 36%, according to Userpilot's 2025 benchmark data. Meaning nearly two out of three signups leave before experiencing what you built. Product tours are one of the most direct interventions for closing that gap, but only when they're built to drive action rather than display information.

Here's how activation rate works, what the benchmarks look like, and how to build tours that actually move the number.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

User activation rate is the percentage of new signups who complete a specific activation event within a set time window. The formula: activated users divided by total signups, multiplied by 100. As of 2026, the SaaS average is 36% (median 30%) per [Userpilot](https://userpilot.com/blog/user-activation-for-saas/). Interactive product tours improve this by up to 50% vs static tutorials per [Chameleon's 15M interaction study](https://www.chameleon.io/blog/product-tour-benchmarks-highlights).

## How to calculate it

```
Activation Rate = (Users who completed activation event / Total signups) x 100
```

The activation event is product-specific. Slack: 2,000 messages sent. Uber: first ride completed. PM tool: project created + teammate invited.

Three variations:

- **Basic rate**: All-time snapshot
- **Cohorted rate**: Per signup cohort (weekly, by source, by plan tier)
- **Time-windowed rate**: Within 24h, 7d, or 30d post-signup

Use cohorted. All-time rates smooth out changes and mask whether your latest iteration worked.

## 2026 benchmarks by vertical

| Industry / Segment | Activation Rate | Source |
|---|---|---|
| AI & Machine Learning | 54.8% | AGL Research 2025 |
| CRM | 42.6% | AGL Research 2025 |
| Sales-led SaaS | 41.6% | AGL Research 2025 |
| SaaS average | 36% | Userpilot 2025 |
| Product-led SaaS | 34.6% | AGL Research 2025 |
| SaaS median | 30% | Userpilot 2025 |
| Mobile apps (global) | 8.4% | Business of Apps 2026 |
| FinTech & Insurance | 5.0% | AGL Research 2025 |

## Why most tours don't move activation

Chameleon analyzed 15M interactions: average tour completion is 61%, yet activation often stays flat.

The culprit: click-through tours. Users click "Next" five times without doing anything. Completion looks healthy. Activation doesn't move.

What works instead:

1. **Action-based progression** -- 123% higher completion (Chameleon)
2. **Five steps or fewer** -- top performers cap here
3. **Progress indicators** -- +12% completion, -20% dismissal

## Building it in React

```tsx
import { useTour } from '@tourkit/react';

const activationSteps = [
  {
    id: 'create-project',
    target: '#new-project-btn',
    title: 'Create your first project',
    content: 'Click this button to start a new project.',
    advanceOn: { selector: '#project-created', event: 'project:created' },
  },
  {
    id: 'invite-teammate',
    target: '#invite-btn',
    title: 'Invite a teammate',
    content: 'Projects work better with your team.',
    advanceOn: { selector: '#invite-form', event: 'invite:sent' },
  },
];

export function ActivationTour() {
  const { currentStep, isActive } = useTour({
    tourId: 'activation-flow',
    steps: activationSteps,
  });

  if (!isActive) return null;

  return (
    <div role="dialog" aria-label={`Step ${currentStep + 1} of ${activationSteps.length}`}>
      {/* Your tour UI */}
    </div>
  );
}
```

Steps advance on real user behavior, not button clicks.

## Onboarding tactics compared

| Tactic | Impact | Source |
|---|---|---|
| Interactive walkthroughs | +50% vs static | Chameleon 2025 |
| Onboarding checklists | Up to 3x conversion | Sked Social |
| Action-based tours | 123% higher completion | Chameleon 15M study |
| Progress indicators | +12% completion | Chameleon 2025 |
| Reducing signup fields | +12-28% completion | Multiple studies |
| Role-based personalization | +47% activation | Attention Insight |

Full article with all code examples, analytics tracking hook, and FAQ: [usertourkit.com/blog/what-is-user-activation-rate](https://usertourkit.com/blog/what-is-user-activation-rate)
