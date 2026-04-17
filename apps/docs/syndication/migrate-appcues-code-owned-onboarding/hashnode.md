---
title: "Migrating from Appcues to code-owned onboarding (complete guide)"
slug: "migrate-appcues-code-owned-onboarding"
canonical: https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding
tags: react, javascript, web-development, typescript, tutorial
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)*

# Migrating from Appcues to code-owned onboarding

Appcues works until it doesn't. The $249/month starting price climbs as your MAU count grows, the "no-code" builder still needs a developer when flows get complex, and every tour you've built lives on someone else's servers. If your team has outgrown the tradeoffs, this guide walks through replacing Appcues with Tour Kit, a headless React library where onboarding flows live in your codebase, ship with your deploys, and cost nothing per user.

Budget 4-6 hours for a typical migration of 5-10 Appcues flows. The strategy is incremental: install Tour Kit alongside Appcues, rebuild one flow at a time, run both in parallel, then remove the Appcues SDK.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate?

**Cost scales with users, not value.** Appcues Growth starts at $879/month for 2,500 MAUs. Hit 5,000 MAUs and you're at $1,150+/month.

**"No-code" still needs developers.** Complex flows require CSS overrides and JavaScript callbacks. You end up maintaining two systems.

**Flows don't live in your repo.** No version control, no code review, no `git revert`.

## Concept mapping

| Appcues concept | Tour Kit equivalent |
|---|---|
| Flow (multi-step) | `useTour()` with step array |
| Tooltip / Hotspot | `@tour-kit/hints` (5KB gzipped) |
| Modal | `@tour-kit/announcements` |
| Checklist | `@tour-kit/checklists` |
| NPS survey | `@tour-kit/surveys` |
| Segment targeting | React conditional rendering |
| Visual builder | No equivalent (code-first) |

## Step-by-step migration

1. **Audit flows** - Catalog active flows, kill the 30-40% with zero impressions
2. **Install alongside** - Both systems coexist during transition
3. **Rebuild highest-traffic flow** - TypeScript step arrays, your own JSX
4. **Wire analytics** - Route events to PostHog/Mixpanel/Amplitude
5. **Run in parallel** - Compare completion rates for 1-2 weeks
6. **Remove Appcues SDK** - `npm uninstall @appcues/web-sdk`

## What you gain vs. what you lose

Gains: Zero per-user cost, version control, design system integration, React 19 support, TypeScript, 8KB bundle.

Losses: Visual builder (biggest tradeoff), hosted analytics dashboard, pre-built templates.

Full article with all code examples and troubleshooting: [usertourkit.com/blog/migrate-appcues-code-owned-onboarding](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)
