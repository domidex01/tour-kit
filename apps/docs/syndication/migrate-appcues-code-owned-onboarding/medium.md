# How to replace your $879/month onboarding tool with a React library

## A step-by-step migration guide for teams outgrowing Appcues

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)*

Appcues works until it doesn't. The starting price climbs as your user count grows, the "no-code" builder still needs a developer when flows get complex, and every tour you've built lives on someone else's servers.

If your team has outgrown these tradeoffs, this guide walks through replacing Appcues with Tour Kit, a headless React library where onboarding flows live in your codebase and cost nothing per user. Budget 4-6 hours for a typical migration of 5-10 flows.

## Why teams leave Appcues

Three patterns push engineering teams toward code-owned alternatives.

**Cost scales with users.** Appcues Growth starts at $879/month for 2,500 monthly active users on an annual contract. Hit 5,000 MAUs and you're at $1,150+/month. For a B2B SaaS with 10,000 users, the annual bill tops $15,000.

**"No-code" has limits.** One G2 reviewer wrote: "The implementation required us to hire JS developers. It was lengthy and confusing to set up." When flows need conditional logic, teams write JavaScript callbacks anyway.

**No version control.** Every flow lives on Appcues' servers. You can't code-review changes or roll back with git revert.

## The migration strategy

The approach is incremental. Install the new library alongside Appcues, rebuild one flow at a time, compare metrics, then remove the old SDK.

**Step 1: Audit your flows.** Most teams find 30-40% of their Appcues flows haven't triggered in months. Don't migrate dead flows.

**Step 2: Install side-by-side.** Both systems coexist. Tour Kit's core is under 8KB gzipped with zero dependencies.

**Step 3: Rebuild your highest-traffic flow.** Translate step selectors and content into TypeScript objects. Render with your own components.

**Step 4: Wire analytics.** Route tour events to your existing PostHog, Mixpanel, or Amplitude pipeline.

**Step 5: Run in parallel for 1-2 weeks.** Compare completion rates before committing.

**Step 6: Remove the Appcues SDK.** Delete the script tag or npm package.

## What you gain and lose

Gains: Zero per-user cost ($99 one-time for Pro vs. $879+/month), version-controlled flows, design system integration, React 19 support, TypeScript throughout, 8KB bundle.

Losses: The visual builder is gone. Non-technical team members need a developer to create flows. No hosted analytics dashboard. No pre-built templates.

The visual builder is the biggest tradeoff. Be upfront about it with your team before starting.

Full article with code examples and an API mapping table: [usertourkit.com/blog/migrate-appcues-code-owned-onboarding](https://usertourkit.com/blog/migrate-appcues-code-owned-onboarding)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
