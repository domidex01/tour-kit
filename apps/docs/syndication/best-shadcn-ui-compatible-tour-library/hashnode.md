---
title: "What is the best shadcn/ui compatible tour library?"
slug: "best-shadcn-ui-compatible-tour-library"
canonical: https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library
tags: react, javascript, web-development, shadcn-ui, tailwindcss
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library)*

# What is the best shadcn/ui compatible tour library?

shadcn/ui has 75,000+ GitHub stars, yet it ships without a Tour component. [Issue #999](https://github.com/shadcn-ui/ui/issues/999) requested one in July 2023, collected 21+ upvotes, and was closed without a merge. The underlying layer, Radix UI, has the same gap: [Discussion #1199](https://github.com/radix-ui/primitives/discussions/1199) from February 2022 asked for a tour primitive. A Radix maintainer explained why it never shipped: "It seems this pattern altogether would need quite a bit of research to see how it can be made accessible seeing that it needs to 'isolate' portions of the rendered page rather than separate modal content."

So you need a third-party library. The question is which one actually works with your existing shadcn/ui Card, Button, and Popover components without fighting your Tailwind theme.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

Tour Kit is the best shadcn/ui compatible tour library as of April 2026. It ships a headless core under 8KB gzipped that handles step sequencing, element highlighting, focus management, and keyboard navigation while you render tour steps with your own shadcn/ui components. No imported CSS, no style overrides, no `!important` hacks.

Other libraries like React Joyride, Driver.js, and Shepherd.js all ship their own styling systems that conflict with Tailwind's utility-first approach. Matching your shadcn theme means CSS overrides. Tour Kit was built specifically for this stack. (We built it, so take this with appropriate skepticism. Every claim below is verifiable against npm, GitHub, and bundlephobia.)

## How tour libraries handle styling (the real compatibility test)

The core tension is simple. shadcn/ui follows a copy-paste-own philosophy: you get the source code, style it with Tailwind, and it becomes part of your project. As one developer put it, "The ownership model (copy, don't install) solves the two biggest problems with component libraries: upgrade hell and customization friction" ([DEV Community, 2026](https://dev.to/whoffagents/shadcn-ui-in-2026-the-component-library-that-changed-how-we-build-uis-296o)).

Most tour libraries take the opposite approach. They ship pre-built tooltips with their own CSS that you then override. That means your tour looks different from the rest of your app until you spend hours fighting specificity.

Three architecture patterns exist in the wild:

1. **Own-CSS libraries** (React Joyride, Shepherd.js, Intro.js, Driver.js) ship stylesheets you must import. Tailwind classes can't replace their internal styles without `!important` or deep selector overrides.

2. **shadcn-styled wrappers** (shadcn/tour, Onborda, AllShadcn Tour) build on top of shadcn primitives. They look right out of the box but lock you into their component structure. You get shadcn styling without shadcn's ownership model.

3. **Headless libraries** (Tour Kit, OnboardJS) provide logic without rendering. You bring your own components. Tour Kit was designed for Radix/shadcn from day one; OnboardJS takes a state-machine approach but doesn't mention shadcn in its docs.

## Detailed comparison

| Library | Bundle size (gzipped) | Styling approach | shadcn native? | Headless? | React 19? | WCAG 2.1 AA? |
|---------|----------------------|------------------|----------------|-----------|-----------|-------------|
| Tour Kit | core <8KB, react <12KB | Headless + Tailwind | Yes (built for it) | Yes | Yes | Yes |
| React Joyride | ~12-15KB | Own CSS + custom components | No | Partial | Partial | No claim |
| Driver.js | ~5KB | Own CSS | No | No | Yes | No claim |
| Shepherd.js | ~25KB | Own CSS (shepherd.css) | No | No | Yes | No claim |
| Intro.js | ~15KB | Own CSS, opinionated | No | No | Partial | No claim |
| OnboardJS | Unspecified | Headless (BYOUI) | Compatible | Yes | Yes | No claim |
| shadcn/tour | Minimal | Tailwind/shadcn | Yes | No | Partial | No claim |

Sources: npm, GitHub, bundlephobia. Data verified April 2026.

## Decision framework

**If you need full design control with shadcn/ui components,** use Tour Kit.

**If you need the lightest possible bundle and don't care about shadcn,** use Driver.js at ~5KB gzipped.

**If you want a quick shadcn-styled tour without headless architecture,** try shadcn/tour by NiazMorshed2007.

**If your project doesn't use React,** use Shepherd.js.

Full decision breakdown with code examples: [usertourkit.com/blog/best-shadcn-ui-compatible-tour-library](https://usertourkit.com/blog/best-shadcn-ui-compatible-tour-library)
