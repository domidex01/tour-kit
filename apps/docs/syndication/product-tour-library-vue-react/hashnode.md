---
title: "Is there a product tour library that works with Vue and React?"
slug: "product-tour-library-vue-react"
canonical: https://usertourkit.com/blog/product-tour-library-vue-react
tags: react, javascript, web-development, vue
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-library-vue-react)*

# Is there a product tour library that works with Vue and React?

If you run Vue on one product and React on another (or both in the same codebase), the standard advice is "pick Shepherd.js." That advice isn't wrong, but it skips the part where Shepherd's React and Vue wrappers are thin convenience layers over a vanilla JS core. You get cross-framework coverage, but you lose the idiomatic hooks and composability that made you choose Vue or React in the first place.

The real question isn't "does a cross-framework tour library exist?" It does. Several do. The question is whether the developer experience survives the abstraction.

We tested the major options in a Vite 6 + React 19 and a Nuxt 3 + Vue 3 project. Here's what we found.

## Short answer

As of April 2026, three product tour libraries work across both Vue and React: Shepherd.js (13.7K GitHub stars, 656 kB unpacked), Driver.js (25.5K stars, 83 kB unpacked), and Intro.js (23.8K stars, 874 kB unpacked, AGPL-licensed). All three are vanilla JavaScript cores with framework wrappers. None provides first-class Vue 3 Composition API hooks or first-class React hooks from a shared engine.

## Detailed comparison

| Feature | Shepherd.js | Driver.js | Intro.js | Tour Kit |
|---------|------------|-----------|----------|----------|
| React support | Official wrapper | Vanilla JS (manual) | Community wrapper | Native hooks |
| Vue support | Official wrapper | Vanilla JS (manual) | Community wrapper | Roadmap |
| Bundle size (gzipped) | ~25 kB | ~5 kB | ~30 kB | Core: <8 kB, React: <12 kB |
| License | MIT | MIT | AGPL-3.0 / Commercial | MIT (core) / Commercial (extended) |
| WCAG 2.1 AA | Partial | No | No | Yes |
| React 19 | Wrapper untested | Yes | Wrapper untested | Yes |
| Analytics | No | No | No | Yes |

## Decision framework

**Vue 3 only:** v-onboarding or VueJS Tour. Neither has a11y compliance.

**React 18+ only:** Tour Kit (headless, accessible) or React Joyride (opinionated, fast setup).

**Both Vue and React:** Shepherd.js (widest support, 656 kB) or Driver.js (lightest at 83 kB, manual integration).

**Migrating between frameworks:** Start framework-agnostic, switch to native after settling.

**Accessibility required:** Tour Kit is the only option with explicit WCAG 2.1 AA compliance (React only today).

Full article with code examples and the complete comparison table: [usertourkit.com/blog/product-tour-library-vue-react](https://usertourkit.com/blog/product-tour-library-vue-react)

---

*Disclosure: We built Tour Kit. All data points are from npm, GitHub, and bundlephobia.*
