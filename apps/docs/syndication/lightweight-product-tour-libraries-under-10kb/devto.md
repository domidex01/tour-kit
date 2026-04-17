---
title: "5 product tour libraries that won't bloat your bundle (all under 10KB gzipped)"
published: false
description: "We tested every product tour library's gzipped size in a Vite 6 + React 19 project. These five stay under 10KB. Includes licensing gotchas, accessibility scores, and tree-shaking support."
tags: react, javascript, webdev, performance
canonical_url: https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb
cover_image: https://usertourkit.com/og-images/lightweight-product-tour-libraries-under-10kb.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)*

# 5 best lightweight product tour libraries under 10KB (2026)

Every kilobyte of JavaScript you ship delays Interaction to Next Paint. Google's Core Web Vitals research shows that pages loading 40KB+ of JS see measurably higher bounce rates on mobile. React Joyride ships around 50KB minified. Shepherd.js clocks in at 30KB plus Floating UI. For a feature that runs once per user, those numbers are hard to justify.

We went looking for tour libraries that stay under 10KB gzipped (not minified, which is meaningless for production). We found five, tested each in a Vite 6 + React 19 + TypeScript 5.7 project, and measured real bundle impact using bundlephobia and the Vite build analyzer.

**Bias disclosure:** Tour Kit is our project, so it's listed first. We've tried to be fair with every entry. Every bundle size, star count, and license below is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## How we evaluated these libraries

Bundle size alone doesn't tell you whether a library is worth using. A 3KB library with an AGPL license might cost you more than an 8KB one with MIT licensing and built-in accessibility. We scored each library across five dimensions:

- **Gzipped bundle size**: the actual bytes your users download
- **Tree-shaking support**: does the library ship ESM with proper `sideEffects: false` so bundlers can eliminate dead code?
- **Licensing**: MIT and Apache-2.0 are safe for commercial use. AGPL-3.0 requires you to open-source your entire application unless you buy a commercial license
- **Accessibility**: keyboard navigation, ARIA attributes, focus management, `prefers-reduced-motion` support
- **React integration**: native hooks and components vs. imperative APIs that fight React's rendering model

## Quick comparison table

| Library | Gzipped size | Dependencies | React 19 | TypeScript | License | Accessibility | Best for |
|---|---|---|---|---|---|---|---|
| Tour Kit (core) | <8 KB | 0 | Yes | Strict | MIT | WCAG 2.1 AA | Design system teams |
| Driver.js | ~5 KB | 0 | Via hooks | Built-in | MIT | Minimal | Simple highlights |
| Intro.js | ~4-5 KB | 0 | Via wrapper | DefinitelyTyped | AGPL-3.0 | Keyboard nav | Non-commercial |
| Onborda | ~8 KB | Framer Motion | Yes | Built-in | MIT | Not documented | Next.js App Router |
| OnboardJS | ~8-10 KB | 0 | Yes | Built-in | MIT | Not documented | Flow orchestration |

Bundle sizes verified April 2026 via bundlephobia and Vite build analyzer.

## 1. Tour Kit: best for headless tours under 8KB

Tour Kit ships 10 composable packages, but you only install what you need. Core weighs under 8KB gzipped with zero runtime dependencies. Add the React package and you're still under 12KB total. Every import tree-shakes cleanly because tsup outputs ESM with `sideEffects: false` in every package.json.

The headless architecture provides tour logic (step sequencing, positioning, state management, storage) without rendering opinions. You bring your own components. If you're using shadcn/ui, Radix, or Tailwind, your tours match the rest of your app without fighting CSS overrides.

**Strengths:**
- Zero dependencies in the core
- WCAG 2.1 AA compliance with focus trapping, keyboard navigation, ARIA live regions, and `prefers-reduced-motion` support
- React 18 and 19 native support with hooks like `useTour()` and `useStep()`
- Optional packages for analytics, checklists, announcements, hints, scheduling, and surveys

**Limitations:**
- Younger project with a smaller community than React Joyride or Shepherd.js
- No visual builder — you write tour definitions in code
- No mobile SDK or React Native support
- Pro packages require a $99 one-time license

**Best for:** React teams with an existing design system who want full control over tour rendering and care about bundle budgets.

## 2. Driver.js: best for zero-dependency element highlighting

Driver.js is the lightest on this list at roughly 5KB gzipped. It highlights DOM elements with animated overlays and optional popovers, all without a single dependency. The API is imperative: you call `driver.highlight()` or `driver.drive()` from vanilla JavaScript.

But Driver.js is a vanilla library, not a React library. Using it in React means writing `useEffect` hooks to sync imperative state with declarative rendering. No built-in state management, no analytics, no persistence.

**Strengths:**
- Smallest production bundle of any maintained tour library (~5KB gzipped, zero deps)
- Clean highlight animations with smooth transitions between elements
- Framework-agnostic — works with React, Vue, Svelte, or plain HTML
- MIT licensed with no commercial restrictions

**Limitations:**
- No React integration — you wire it yourself with `useEffect`, `useRef`, and manual cleanup
- No state management, no progress persistence, no analytics
- Accessibility is minimal — no ARIA live regions, no focus trapping
- Community maintenance can be sporadic

**Best for:** Teams that need lightweight element highlighting and are comfortable wiring React integration manually.

## 3. Intro.js: smallest bundle, biggest licensing gotcha

Intro.js is arguably the smallest tour library at 4-5KB gzipped. The step-based API is straightforward, keyboard navigation works, and it's been around since 2013. It's also licensed under AGPL-3.0, which means using it in a closed-source commercial product requires buying a commercial license.

This isn't a footnote. AGPL-3.0 requires that any application using the library must make its own source code available under the same license.

**Strengths:**
- One of the smallest production bundles (~4-5KB gzipped)
- Stable project with over a decade of production use
- Built-in keyboard navigation
- Zero runtime dependencies

**Limitations:**
- AGPL-3.0 license — commercial use requires a paid license
- Imperative API that doesn't map cleanly to React's component model
- TypeScript types come from DefinitelyTyped, not the library itself
- No built-in analytics, no headless mode, brittle CSS-selector-based targeting

**Best for:** Non-commercial or open-source projects where the AGPL license isn't a constraint.

## 4. Onborda: best for Next.js App Router under 10KB

Onborda is purpose-built for Next.js App Router projects. Around 8KB gzipped with built-in TypeScript support and React 19 compatibility. It uses Framer Motion for animations, which is worth noting: if you're not already using Framer Motion, adding Onborda means adding its 30KB+ peer dependency too.

**Strengths:**
- Designed specifically for Next.js App Router
- Clean component API that feels native to React 19 patterns
- Built-in TypeScript support with typed step definitions
- MIT licensed

**Limitations:**
- Requires Framer Motion as a peer dependency (30KB+)
- Next.js only
- Smaller ecosystem and community
- Accessibility features aren't documented

**Best for:** Next.js App Router projects that already use Framer Motion.

## 5. OnboardJS: best for headless flow orchestration

OnboardJS takes a different approach. It's a flow orchestration library, not a DOM highlighting library. You define tour steps as a state machine, and OnboardJS handles sequencing, branching, and analytics. You render everything yourself. The core is around 8-10KB gzipped with zero dependencies.

**Strengths:**
- Genuinely headless with zero rendering opinions
- State machine architecture supports branching tours and complex flows
- Built-in analytics and event tracking
- MIT licensed

**Limitations:**
- No DOM highlighting, no element targeting, no overlay system
- Newer project with a smaller community
- More integration work required
- Documentation is growing but not comprehensive yet

**Best for:** Teams that want a state machine for tour flow orchestration and are willing to build their own highlighting UI.

## How to choose

**Do you need DOM highlighting or just flow control?** If you need to point at elements with overlays, Driver.js (vanilla) and Tour Kit (React) are your options under 10KB. For step sequencing only, OnboardJS works.

**Is your project commercial?** If yes, cross Intro.js off the list unless you budget for the commercial license.

**Are you using React with a design system?** Tour Kit is the only sub-10KB option that's headless, React-native, and accessible. Driver.js is lighter but requires manual React wiring. Onborda works if you're locked to Next.js and already carry Framer Motion.

---

Full article with FAQ, tree-shaking analysis, and Core Web Vitals context: [usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb](https://usertourkit.com/blog/lightweight-product-tour-libraries-under-10kb)
