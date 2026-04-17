---
title: "The Open-Source Onboarding Stack: Composing Tours, Analytics, and Surveys from Libraries"
canonical_url: https://usertourkit.com/blog/open-source-onboarding-stack
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/open-source-onboarding-stack)*

# The Open-Source Onboarding Stack: Build Your Own With Code

Most teams treat user onboarding as a single tool decision — buy a SaaS platform, drop in a script tag, let product managers create tours visually. This works until the quarterly invoice arrives at $15,000, your pages load an additional 300KB of vendor JavaScript, and every tooltip change requires a deployment ticket.

There is a third option between building from scratch and buying a platform. You assemble a stack from open-source libraries, the same way you would pick a database, a UI framework, and an analytics tool. Each layer handles one concern. You own the code, the data, and the deployment.

## The Five-Layer Architecture

An open-source onboarding stack maps to five concerns:

| Layer | Responsibility | Open-Source Options |
|-------|---------------|---------------------|
| Guidance | Product tours, tooltips, checklists | Tour Kit (MIT, <8KB), Shepherd.js, Driver.js |
| Analytics | Completion tracking, retention analysis | PostHog (MIT), Plausible (AGPL), Umami |
| Feature Flags | User segment targeting, A/B testing | PostHog, GrowthBook (MIT), Flagsmith (BSD-3) |
| Feedback | NPS, CSAT, CES surveys | Tour Kit Surveys, Formbricks (AGPL) |
| UI | Rendering with your design system | shadcn/ui, Radix UI |

## Cost Comparison

| Approach | Startup Cost | Enterprise (3yr) |
|----------|-------------|-------------------|
| Build in-house | $60,000 | $3,500,000 |
| Buy SaaS (Appcues/Pendo) | $2,388-$60,000/yr | $108,000-$288,000 |
| Open-source stack | $0 license + eng time | $0 license + eng time |

Source: Userpilot build-vs-buy analysis. Maintenance for in-house builds runs 15-20% of original project cost annually.

## Guidance Layer Selection

As of April 2026, React Joyride has 400K+ weekly npm downloads but has not been updated in nine months and does not support React 19. Tour Kit and OnboardJS are the two headless options with React 19 support and full TypeScript coverage.

The headless architecture separates tour logic from UI rendering. Your application provides hooks for state management and positioning; you render steps with your own design system components. This eliminates CSS conflicts and ensures tours match your product's visual language.

## The PostHog Integration

PostHog provides product analytics, session replay, feature flags, and A/B testing in a single self-hosted deployment. However, it cannot deliver in-app guidance or user onboarding flows. A tour library fills that gap precisely.

Tour Kit's analytics package uses a plugin architecture that pipes tour events (step viewed, tour completed, step duration) directly into PostHog's event stream. This allows teams to build funnels and cohort analyses in a single analytics tool.

## When to Choose SaaS Instead

The open-source stack requires React 18+ and TypeScript developers. There is no visual tour builder. Choose a SaaS platform when product managers need to create tours without code deployment, or when speed to first tour matters more than long-term ownership and bundle size.

---

*Full article with code examples, reference architecture, and installation guide: [usertourkit.com/blog/open-source-onboarding-stack](https://usertourkit.com/blog/open-source-onboarding-stack)*
