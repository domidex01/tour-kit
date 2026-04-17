# Twitter/X Thread

**Thread (5 tweets):**

---

**1/5**
We tested 7 product tour libraries inside a Turborepo monorepo with a shared design system.

Most roundups test in a single-app Vite starter. That misses the real problems: style conflicts, tree-shaking across workspaces, peer dep hoisting.

Here's what we found:

---

**2/5**
The #1 problem: style isolation.

Libraries that inject global CSS (.shepherd-element, inline styles) fight your design tokens.

Headless libraries (zero CSS) let your design system render tour UI. Your tooltip, your tokens, your z-index scale.

---

**3/5**
Tree-shaking matters differently in monorepos.

When App A imports @tourkit/react but App B only needs @tourkit/core, per-package sideEffects: false means App B doesn't bundle React components.

Most tour libraries ship as a single bundle. No granularity.

---

**4/5**
Quick scores (0-10, weighted for design system use):

userTourKit: 9.4 (headless, zero CSS)
Driver.js: 7.2 (tiny, but CSS required)
OnboardJS: 7.0 (state machine only)
Onborda: 6.8 (Tailwind-native)
Shepherd.js: 5.1 (global CSS, heavy)
Reactour: 4.5 (styled-components)
React Joyride: 3.8 (inline styles)

---

**5/5**
Full comparison with code examples, scoring rubric, and monorepo setup patterns:

https://usertourkit.com/blog/best-product-tour-libraries-monorepo-design-system-teams

Bias disclosure: We built userTourKit. Every claim is verifiable against npm/GitHub/bundlephobia.
