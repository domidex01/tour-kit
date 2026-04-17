---
title: "5 best lightweight product tour libraries under 10KB (2026)"
slug: "lightweight-product-tour-libraries-under-10kb"
canonical: https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb
tags: react, javascript, web-development, performance, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)*

# 5 best lightweight product tour libraries under 10KB (2026)

Every kilobyte of JavaScript you ship delays Interaction to Next Paint. Google's Core Web Vitals research shows that pages loading 40KB+ of JS see measurably higher bounce rates on mobile. React Joyride ships around 50KB minified. Shepherd.js clocks in at 30KB plus Floating UI. For a feature that runs once per user, those numbers are hard to justify.

We went looking for tour libraries that stay under 10KB gzipped (not minified, which is meaningless for production). We found five, tested each in a Vite 6 + React 19 + TypeScript 5.7 project, and measured real bundle impact using bundlephobia and the Vite build analyzer.

**Bias disclosure:** Tour Kit is our project, so it's listed first. We've tried to be fair with every entry. Every bundle size, star count, and license below is verifiable against npm, GitHub, and bundlephobia.

## Quick comparison table

| Library | Gzipped size | Dependencies | React 19 | License | Accessibility | Best for |
|---|---|---|---|---|---|---|
| Tour Kit (core) | <8 KB | 0 | Yes | MIT | WCAG 2.1 AA | Design system teams |
| Driver.js | ~5 KB | 0 | Via hooks | MIT | Minimal | Simple highlights |
| Intro.js | ~4-5 KB | 0 | Via wrapper | AGPL-3.0 | Keyboard nav | Non-commercial |
| Onborda | ~8 KB | Framer Motion | Yes | MIT | Not documented | Next.js App Router |
| OnboardJS | ~8-10 KB | 0 | Yes | MIT | Not documented | Flow orchestration |

Bundle sizes verified April 2026 via bundlephobia and Vite build analyzer.

## 1. Tour Kit: best for headless tours under 8KB

Tour Kit ships 10 composable packages, but you only install what you need. Core weighs under 8KB gzipped with zero runtime dependencies. The headless architecture provides tour logic without rendering opinions. You bring your own components.

**Strengths:** Zero deps, WCAG 2.1 AA, React 18/19 native, tree-shakeable ESM.
**Limitations:** Younger project, no visual builder, no React Native, Pro packages $99 one-time.

## 2. Driver.js: best for zero-dependency element highlighting

Lightest on the list at ~5KB gzipped. Highlights DOM elements with animated overlays. Vanilla JS with imperative API.

**Strengths:** Smallest bundle, zero deps, framework-agnostic, MIT.
**Limitations:** No React integration (manual useEffect), no state management, minimal accessibility.

## 3. Intro.js: smallest bundle, biggest licensing gotcha

Arguably the smallest at 4-5KB gzipped. Been around since 2013. But licensed under AGPL-3.0 — commercial use requires a paid license.

**Strengths:** Tiny bundle, decade of stability, keyboard nav, zero deps.
**Limitations:** AGPL-3.0, imperative API, DefinitelyTyped types, no analytics.

## 4. Onborda: best for Next.js App Router under 10KB

Purpose-built for Next.js App Router. ~8KB gzipped but requires Framer Motion (30KB+ peer dep).

**Strengths:** Next.js native, React 19, TypeScript, MIT.
**Limitations:** Framer Motion dependency, Next.js only, undocumented accessibility.

## 5. OnboardJS: best for headless flow orchestration

Flow orchestration library, not a DOM highlighting library. ~8-10KB gzipped with zero deps.

**Strengths:** Genuinely headless, state machine architecture, built-in analytics, MIT.
**Limitations:** No DOM highlighting, newer project, more integration work.

## How to choose

- **Need DOM highlighting?** Driver.js (vanilla) or Tour Kit (React)
- **Commercial project?** Skip Intro.js unless you pay for the license
- **React + design system?** Tour Kit is the only sub-10KB headless, accessible option

Full article with FAQ and tree-shaking analysis: [usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)
