---
title: "Migrating from Shepherd.js to Tour Kit: AGPL to MIT"
slug: "migrate-shepherd-js-tour-kit"
canonical: https://usertourkit.com/blog/migrate-shepherd-js-tour-kit
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)*

# Migrating from Shepherd.js to Tour Kit: AGPL to MIT

Shepherd.js is a solid product tour library with 13,000+ GitHub stars and 221K weekly npm downloads as of April 2026. But two things push teams to migrate: its AGPL-3.0 license creates real legal exposure for commercial SaaS products, and its vanilla-JS-with-React-wrapper architecture fights React's component model instead of working with it. If your legal team flagged the AGPL dependency or your React 19 upgrade stalled on `react-shepherd` compatibility issues, this guide walks you through replacing Shepherd.js with Tour Kit, a headless, MIT-licensed alternative that ships at under 8KB gzipped.

By the end, you'll have your existing Shepherd tours running on Tour Kit with native React hooks, zero CSS conflicts, and no license risk.

```bash
npm install @tourkit/core @tourkit/react
```

> The full article with all 5 migration steps, code examples, troubleshooting, and FAQ is at [usertourkit.com/blog/migrate-shepherd-js-tour-kit](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)

## Key points

- Shepherd.js uses AGPL-3.0 for its core. Commercial SaaS products need a $50-$300 license or must open-source their frontend.
- `react-shepherd` is MIT, but depends on AGPL `shepherd.js` core. AGPL cascades through deps.
- Google completely prohibits AGPL-licensed software internally.
- Tour Kit is MIT across all 10 packages. No dual licensing.
- Tour Kit's core is under 8KB gzipped vs Shepherd's 13.7KB.
- Tour Kit uses native React hooks and context. No vanilla JS wrapper that breaks on React upgrades.
- Shepherd.js had a months-long React 19 compatibility gap (GitHub issue #3102).

## The migration in 5 steps

1. **Install Tour Kit alongside Shepherd** — run both simultaneously
2. **Convert step definitions** — replace `tour.addStep()` with declarative `steps` array
3. **Migrate event callbacks** — consolidate `when` handlers into `onStepChange`/`onComplete`/`onDismiss`
4. **Handle multi-page tours** — use `persist="localStorage"` on TourProvider
5. **Remove Shepherd** — `npm uninstall shepherd.js react-shepherd`

Read the full guide with before/after code examples: [usertourkit.com/blog/migrate-shepherd-js-tour-kit](https://usertourkit.com/blog/migrate-shepherd-js-tour-kit)

---

*We built Tour Kit, so take migration advice with appropriate skepticism. Shepherd.js is maintained by Ship Shape and has served the community well for years.*
