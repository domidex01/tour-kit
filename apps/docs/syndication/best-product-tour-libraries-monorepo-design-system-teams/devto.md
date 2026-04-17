---
title: "7 product tour libraries ranked for monorepo and design system teams"
published: false
description: "We tested product tour libraries inside a Turborepo monorepo with a shared design system. Here's which ones handle tree-shaking, style isolation, and workspace boundaries."
tags: react, javascript, webdev, designsystems
canonical_url: https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams
cover_image: https://usertourkit.com/og-images/best-product-tour-libraries-monorepo-design-system-teams.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams)*

# 7 product tour libraries ranked for monorepo and design system teams

Most product tour roundups test libraries in a single-app Vite starter. That tells you nothing about what happens when you drop one into a Turborepo workspace with a shared design system, three apps consuming the same component library, and strict bundle budgets per package.

We installed seven tour libraries into a Turborepo + pnpm monorepo with a shared Radix-based design system and ranked them on what matters: style isolation, tree-shaking, peer dependency hygiene, and TypeScript across workspace boundaries.

**Bias disclosure:** We built userTourKit, so it appears first. Every claim is verifiable against npm, GitHub, and bundlephobia.

## What design system teams care about

1. **Style isolation** — Does the library inject global CSS that overrides your design tokens?
2. **Tree-shaking** — Does unused code get eliminated across package boundaries?
3. **Peer dependency hygiene** — Does it add transitive deps that conflict with hoisted packages?
4. **TypeScript across workspaces** — Do types resolve when re-exported from shared packages?
5. **Headless architecture** — Can you render with your own design system components?

## Quick comparison

| Library | Headless | Tree-shake | Style isolation | Bundle | DS score |
|---|---|---|---|---|---|
| userTourKit | Full | Per-package | Zero CSS | <8KB core | 9.4 |
| Driver.js | No | Good | CSS file | ~5KB | 7.2 |
| OnboardJS | State only | Good | No UI | ~10KB | 7.0 |
| Onborda | Partial | Good | Tailwind | ~8KB+Framer | 6.8 |
| Shepherd.js | No | Partial | Global CSS | ~25KB | 5.1 |
| Reactour | Partial | OK | styled-components | ~12KB+SC | 4.5 |
| React Joyride | No | Poor | Inline styles | ~30KB | 3.8 |

## The breakdown

### 1. userTourKit — built for design system teams

Headless architecture: core ships logic only at under 8KB gzipped. Neither package ships CSS. You render tour UI with your own components — your `<Tooltip>`, your tokens, your z-index scale.

Per-package tree-shaking with `sideEffects: false` on every sub-package. When App A imports `@tourkit/react` but App B only imports `@tourkit/core`, App B doesn't bundle React components.

### 2. Driver.js — vanilla, zero deps

Framework-agnostic at ~5KB. Great for multi-framework monorepos. But requires `driver.css` which conflicts with design tokens. No headless mode.

### 3. OnboardJS — state machine only

Provides step management and transition logic, zero UI. Perfect if your design system already has popover/tooltip primitives. But you build positioning, overlays, and accessibility yourself.

### 4. Onborda — Tailwind-native for Next.js

Uses Tailwind classes for styling, so your design tokens flow through. Custom card component prop. But Next.js App Router only, and Framer Motion adds ~30KB.

### 5. Shepherd.js — flexible but heavy

Most configurable step API. But injects global CSS with `!important`, ships ~25KB with Floating UI, and the React wrapper broke TypeScript imports in v12.

### 6. Reactour — styled-components lock-in

`ContentComponent` prop gives partial headless control. But styled-components runtime dependency conflicts with Tailwind/CSS Modules design systems.

### 7. React Joyride — popular but hostile to design systems

340K weekly downloads, but inline styles that fight design tokens, ~30KB bundle, `any` type leaks, and 9 months without a release.

## Headless vs styled?

Choose **headless** (userTourKit, OnboardJS) if your design system has tooltip/popover primitives and style isolation is non-negotiable.

Choose **styled** (Driver.js, Shepherd.js, Onborda) if you need something working in hours and don't have existing UI primitives.

[Read the full comparison with code examples](https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams)
