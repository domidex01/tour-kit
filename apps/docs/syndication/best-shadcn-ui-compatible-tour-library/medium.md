# shadcn/ui Has No Tour Component — Here's What to Use Instead

*A comparison of 7 tour libraries for the shadcn/ui + Tailwind stack*

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library)*

---

shadcn/ui has 75,000+ GitHub stars, yet it ships without a Tour component. Issue #999 requested one in July 2023, collected 21+ upvotes, and was closed without a merge. Radix UI has the same gap — a discussion from February 2022 asked for a tour primitive and a maintainer explained the accessibility challenges would require significant research.

So you need a third-party library. The question is which one works with your existing shadcn/ui components without fighting your Tailwind theme.

## The styling compatibility problem

shadcn/ui follows a copy-paste-own philosophy: you get the source code, style it with Tailwind, and it becomes part of your project. Most tour libraries take the opposite approach — they ship pre-built tooltips with their own CSS that you then override.

Three architecture patterns exist:

**Own-CSS libraries** (React Joyride, Shepherd.js, Intro.js, Driver.js) ship stylesheets you must import. Tailwind classes can't replace their internal styles without `!important` hacks.

**shadcn-styled wrappers** (shadcn/tour, Onborda) build on top of shadcn primitives. They look right out of the box but lock you into their component structure.

**Headless libraries** (Tour Kit, OnboardJS) provide logic without rendering. You bring your own components.

## Quick decision framework

If you need full design control with your shadcn/ui Card, Button, and Popover components — use Tour Kit. It ships a headless core under 8KB gzipped. You render tour steps with your own components. No CSS imports, no overrides.

If you need the lightest possible bundle — use Driver.js at ~5KB. You'll import driver.css and your tour won't match your app's design, but it's tiny.

If you want shadcn styling without headless architecture — try shadcn/tour. Fewer features, but native shadcn look.

If your project doesn't use React — use Shepherd.js. Framework-agnostic, battle-tested.

Full comparison table, code examples, and FAQ at the original article.

---

*Disclosure: I built Tour Kit. Every data point above is verifiable against npm, GitHub, and bundlephobia.*

**Submit to:** JavaScript in Plain English, Better Programming, or Bits and Pieces on Medium.
