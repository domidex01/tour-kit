---
title: "Tour Kit in a Turborepo monorepo: shared tours across apps"
slug: "tour-kit-turborepo-monorepo-shared-tours"
canonical: https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours
tags: react, typescript, web-development, monorepo
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours)*

# Tour Kit in a Turborepo monorepo: shared tours across apps

You have three React apps in a Turborepo workspace. Each one needs a product tour. The instinct is to install `@tour-kit/react` in every app, copy-paste the same step definitions, and move on. That works until someone changes a step label in one app and forgets the other two.

A better approach: put your tour definitions in a shared internal package. One source of truth for step content, progression logic, and completion tracking. Tour Kit's headless architecture makes this practical because the library separates tour logic from UI rendering.

This tutorial walks through the full setup: a `packages/tours` workspace consumed by a Next.js dashboard and a Vite marketing site, with proper tree shaking, TypeScript types, and shared completion state.

Full article with all 7 steps, code examples, tree shaking benchmarks, and troubleshooting: [usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours](https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours)
