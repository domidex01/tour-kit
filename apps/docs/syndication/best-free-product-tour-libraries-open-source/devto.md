---
title: "I tested 9 open-source tour libraries in the same React 19 project -- here's what actually works"
published: false
description: "Installed 9 free product tour libraries into a Vite 6 + React 19 + TypeScript 5.7 project. Measured bundle sizes, checked accessibility, and found one popular library with a license trap."
tags: react, opensource, typescript, webdev
canonical_url: https://usertourkit.com/blog/best-free-product-tour-libraries-open-source
cover_image: https://usertourkit.com/og-images/best-free-product-tour-libraries-open-source.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-free-product-tour-libraries-open-source)*

Most "best product tour" roundups mix SaaS platforms charging $249/month with open-source libraries you can npm install for free. That makes comparison useless if you've already decided to own your code. This list covers only libraries with a real open-source license, an active maintainer, and a published npm package you can install today.

We installed each library into a Vite 6 + React 19 + TypeScript 5.7 project and built a 5-step tour targeting a sidebar, a button, and a modal. We measured bundle size via bundlephobia, checked TypeScript coverage, tested keyboard navigation, and verified the license in `package.json`.

**Bias disclosure:** We built userTourKit, so it's listed first. We've tried to be fair with every entry. Every claim below is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tour-kit/core @tour-kit/react
```

## How we evaluated these libraries

We scored each library against six criteria that matter for production React apps:

- **Bundle size (20%)**: gzipped weight from bundlephobia. Smaller is better for Core Web Vitals. Google's own research shows [pages loading 40KB+ of JS see higher bounce rates on mobile](https://web.dev/articles/vitals)
- **TypeScript support (20%)**: built-in types vs DefinitelyTyped vs none
- **React 19 compatibility (15%)**: tested with `react@19.0.0`, not just claimed
- **Accessibility (20%)**: WCAG 2.1 AA compliance, keyboard navigation, ARIA roles, `prefers-reduced-motion` support
- **Maintenance activity (15%)**: last npm publish, open issues, commit frequency
- **License clarity (10%)**: MIT/Apache is genuinely free. AGPL has commercial restrictions that catch teams off guard

We weighted accessibility at 20% because [accessible interactive components are a growing priority in the React ecosystem](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/) and no other roundup in this space evaluates it at all.

## Quick comparison table

| Library | Bundle (gzip) | React 19 | TypeScript | License | Accessibility | Best for |
|---|---|---|---|---|---|---|
| userTourKit | Under 8KB core | Yes | Strict | MIT | WCAG 2.1 AA | Design system teams |
| React Joyride | ~30KB | v3 only | Built-in (v3) | MIT | Partial | Quick drop-in tours |
| Shepherd.js | ~25KB | Via wrapper | Built-in | MIT | Keyboard nav | Multi-framework teams |
| Driver.js | ~5KB | Via hooks | Built-in | MIT | Minimal | Lightweight highlights |
| Reactour | ~12KB | Yes | DefinitelyTyped | MIT | Partial overlays | Simple sequential tours |
| OnboardJS | ~10KB | Yes | Built-in | MIT | Not documented | State machine fans |
| Onborda | ~8KB | Yes | Built-in | MIT | Not documented | Next.js App Router |
| Intro.js | ~10KB | Via wrapper | DefinitelyTyped | **AGPL** | Keyboard nav | Non-commercial projects |
| GuideChimp | ~15KB | Via wrapper | Partial | MIT | Minimal | Multi-page tours |

Data verified April 2026. Sources: npm, GitHub, bundlephobia, official docs.

## 1. userTourKit: best for teams with a design system

![Screenshot of userTourKit - Product Tours for React](https://usertourkit.com/screenshots/user-tour-kit.avif)

userTourKit is a headless React product tour library that ships as 10 composable packages at under 8KB gzipped for the core. It renders with your existing components (shadcn/ui, Radix, Tailwind, anything) instead of shipping its own UI. React 18 and 19 are supported natively, with TypeScript strict mode throughout. The library includes tours, hints, checklists, announcements, analytics, and scheduling in separate packages you install individually.

**What makes it different:** Headless architecture means zero style conflicts. The `asChild` pattern (UnifiedSlot) works with both Radix UI and Base UI, so your tour tooltips look identical to the rest of your app. No CSS overrides, no `!important` hacks, no fighting the library's opinions.

**Strengths:**
- 10 packages installed individually: you ship only what you use
- WCAG 2.1 AA compliance with focus management, ARIA roles, and keyboard navigation
- Built-in analytics plugin system (PostHog, Mixpanel, or custom)
- `prefers-reduced-motion` respected by default

**Limitations:**
- Requires React developers. No visual builder, no drag-and-drop
- Younger project with a smaller community than React Joyride or Shepherd.js
- No React Native support

**Pricing:** Free (MIT). Pro features available for $99 one-time.

**Best for:** React teams using shadcn/ui, Radix, or a custom design system who want full control over how tours render.

## 2. React Joyride: best for quick drop-in tours

![Screenshot of React Joyride](https://usertourkit.com/screenshots/react-joyride.avif)

React Joyride is the most downloaded React tour library on npm, with 758K weekly downloads and 7,682 GitHub stars as of April 2026. It ships pre-built tooltip UI using react-floater, which means you get a working tour in minutes without writing any styling code. Version 3.0.2 added built-in TypeScript types and React 19 support.

As one comparison article put it: "For React-heavy products, React Joyride and Reactour make more sense than pretending framework differences do not matter" ([Userorbit, 2026](https://userorbit.com/blog/best-open-source-product-tour-libraries)). That rings true. Joyride is React-native, not a wrapper.

**Strengths:**
- Largest community: 44 contributors, 11K+ npm dependent projects
- Pre-built UI gets you from zero to working tour in under 10 minutes
- Controlled and uncontrolled modes for simple and complex use cases
- Active maintenance with v3 rewrite shipping in 2025-2026

**Limitations:**
- Opinionated styling clashes with Tailwind and CSS Modules
- No headless mode: you get their UI or nothing
- Bundle size (~30KB gzipped) is 4x userTourKit's core
- No built-in analytics, checklists, or scheduling

**Pricing:** Free (MIT).

**Best for:** Teams that want a working tour in 10 minutes and don't mind the default tooltip UI.

## 3. Shepherd.js: best for multi-framework teams

![Screenshot of Shepherd.js](https://usertourkit.com/screenshots/shepherd-js.avif)

Shepherd.js is a framework-agnostic tour library with 13K+ GitHub stars and 100+ contributors. It ships adapters for React, Vue, Angular, and Ember, making it the go-to choice for teams maintaining apps across multiple frameworks. Ship Shape, a consultancy, maintains it professionally.

"For most teams that want a strong all-around open-source option, Shepherd.js is the safest recommendation" ([Userorbit, 2026](https://userorbit.com/blog/best-open-source-product-tour-libraries)). Hard to argue with that track record.

**Strengths:**
- Framework-agnostic core with dedicated React wrapper (react-shepherd)
- 170+ releases, latest March 2026: consistently maintained
- Keyboard navigation support
- Step-based API is clean and well-documented

**Limitations:**
- React wrapper adds a DOM abstraction layer with its own lifecycle. You're not writing React components, you're configuring a JavaScript engine
- Ships its own CSS that conflicts with Tailwind utility classes
- Bundle size (~25KB gzipped) adds up on mobile connections
- No built-in analytics or checklist support

**Pricing:** Free (MIT).

**Best for:** Teams building apps in multiple frameworks (React + Vue, React + Angular) who need one tour library for everything.

## 4. Driver.js: best for lightweight element highlighting

![Screenshot of driver.js](https://usertourkit.com/screenshots/driver-js.avif)

Driver.js is the smallest library on this list at roughly 5KB gzipped. It's built in TypeScript from the ground up and uses SVG overlays for element highlighting that look genuinely good out of the box. The API is simple: a few function calls, not component trees.

"Driver.js is lean, focused, and refreshingly direct... often the fastest way to get there if your team mainly needs highlighting" ([Userorbit, 2026](https://userorbit.com/blog/best-open-source-product-tour-libraries)).

**Strengths:**
- Smallest bundle (~5KB gzipped) in the category
- Beautiful default spotlight animations
- TypeScript-first codebase
- Works in any framework or no framework

**Limitations:**
- No React integration: uses direct DOM manipulation, which conflicts with React's virtual DOM. You'll need `useEffect` and refs to make it work safely
- No component composition: configuration via JS objects, not JSX
- Highlight-focused, not tour-focused: multi-step sequencing is basic
- No state management, analytics, or persistence

**Pricing:** Free (MIT).

**Best for:** Teams that need lightweight element highlighting more than multi-step onboarding. Pairs well with a state manager if you build the tour logic yourself.

## 5. Reactour: best for simple sequential tours

![Screenshot of Reactour](https://usertourkit.com/screenshots/reactour.avif)

Reactour is a React-native tour library that keeps things simple. You define steps as an array of objects with selectors and content, wrap your app in a provider, and the tour runs. About 1,600 GitHub stars and steady maintenance since its v2 rewrite under the `@reactour/tour` package.

**Strengths:**
- Simple API: steps are just `{ selector, content }` objects
- Accessible overlay and mask behavior
- Small footprint (~12KB gzipped)
- React-native, not a framework wrapper

**Limitations:**
- Limited customization beyond basic styling
- No headless mode: you get the built-in popover
- TypeScript via DefinitelyTyped, not built-in
- Smaller community means fewer Stack Overflow answers

**Pricing:** Free (MIT).

**Best for:** Small projects that need a basic sequential tour without the overhead of a larger library.

## 6. OnboardJS: best for state machine architecture

![Screenshot of OnboardJS](https://usertourkit.com/screenshots/onboardjs.avif)

OnboardJS is the newest competitor positioning itself as a headless onboarding framework. It uses a state machine approach to tour logic and ships with built-in analytics plugins for PostHog and Supabase. Closest in philosophy to userTourKit: both are headless, both target React, both separate logic from UI.

**Strengths:**
- Headless architecture: render tours with your own components
- Built-in analytics (PostHog, Supabase, Mixpanel)
- State machine approach prevents impossible tour states
- TypeScript-first

**Limitations:**
- Newer project with a smaller community
- SaaS pricing ($59/month) for advanced features: the free tier has limits
- Documentation is still maturing
- No multi-tour orchestration or checklist support in the free tier

**Pricing:** Free (MIT core) + $59/month for SaaS features.

**Best for:** Teams that want headless architecture with built-in analytics and don't mind a newer, less battle-tested library.

## 7. Onborda: best for Next.js App Router

![Screenshot of Onborda](https://usertourkit.com/screenshots/onborda.avif)

Onborda was built specifically for Next.js App Router projects. It handles server components, client boundaries, and Framer Motion animations out of the box. If your entire stack is Next.js, Onborda removes the framework compatibility question entirely.

**Strengths:**
- Built for Next.js App Router (not retrofitted)
- Framer Motion animations included
- TypeScript built-in
- Works with shadcn/ui out of the box

**Limitations:**
- Next.js only: no support for Vite, Remix, or vanilla React
- Smaller community and contributor base
- No analytics, checklists, or scheduling
- Limited documentation

**Pricing:** Free (MIT).

**Best for:** Next.js App Router projects where framework-specific optimization matters more than cross-framework portability.

## 8. Intro.js: the AGPL licensing trap

![Screenshot of Intro.js](https://usertourkit.com/screenshots/intro-js.avif)

Intro.js ships at ~10KB with zero dependencies and includes keyboard navigation. It works. But the license is AGPL-3.0, which means any commercial project using it must either open-source their entire application or purchase a commercial license starting at $9.99.

Most "free tour library" roundups include Intro.js without flagging this. If you're building a SaaS product, Intro.js isn't free: it's a trial.

**Strengths:**
- Zero external dependencies
- Keyboard navigation and basic accessibility
- Works across frameworks via wrappers
- Small bundle (~10KB)

**Limitations:**
- **AGPL license requires open-sourcing your entire app or paying**: this is the critical gotcha
- Commercial license starts at $9.99 but scales with team size
- No React-native integration (DOM manipulation via wrapper)
- No TypeScript built-in (DefinitelyTyped only)

**Pricing:** Free for non-commercial use (AGPL). Commercial license from $9.99.

**Best for:** Non-commercial or open-source projects. Commercial teams should budget for the license or choose MIT alternatives.

## 9. GuideChimp: best for multi-page tours

GuideChimp has 99 releases and active maintenance as of March 2026. Its standout: multi-page tour support that persists across navigations without losing state.

**Strengths:**
- Multi-page tours that survive page navigations
- 99 releases, steady maintenance
- ~15KB gzipped, extensible plugin architecture

**Limitations:**
- Small community with limited docs
- Partial TypeScript, minimal accessibility

**Pricing:** Free (MIT).

**Best for:** Multi-page apps where tour state must persist across navigations.

## The accessibility gap nobody talks about

Here's what surprised us most. Almost no open-source tour library claims WCAG 2.1 AA compliance.

Shepherd.js mentions keyboard navigation. Reactour has accessible overlays. Intro.js claims "full accessibility support." None of them publish Lighthouse scores or document ARIA role usage. Not one mentions `prefers-reduced-motion`.

Why does this matter? [Accessible interactive components are a growing priority in the React ecosystem](https://www.infoq.com/news/2025/12/accessibility-ariakit-react/) (InfoQ, 2025). Screen reader users and keyboard-only navigators deserve onboarding that works too.

userTourKit scores Lighthouse 100 for accessibility. Every step manages focus, uses ARIA roles (`role="dialog"`, `aria-describedby`), supports Tab/Escape/Arrow keys, and respects `prefers-reduced-motion`. We test with axe-core on every build.

The bar is low right now. Ship ARIA roles and keyboard nav and you're ahead of most libraries in this space.

## How to choose the right library for your project

**Choose a headless library (userTourKit, OnboardJS)** if your team has React developers and you want tour UI that matches your design system exactly. You write more JSX, but you avoid style conflicts entirely.

**Choose an opinionated library (React Joyride, Shepherd.js)** if you need a working tour in under an hour and the default tooltip UI is acceptable. Joyride for React-only, Shepherd for multi-framework.

**Choose a lightweight library (Driver.js)** if you primarily need element highlighting and simple step-throughs rather than full onboarding flows with checklists and analytics.

**Choose a framework-specific library (Onborda)** if you're committed to Next.js and want the tightest possible integration with App Router and server components.

**Avoid AGPL libraries (Intro.js) in commercial projects** unless you're prepared to open-source your app or pay for a commercial license. MIT is the safe default.

## FAQ

### What is the best free product tour library for React in 2026?

userTourKit and React Joyride are the two strongest free options for React. userTourKit is headless (under 8KB, WCAG 2.1 AA, works with any design system), while React Joyride ships pre-built UI for faster setup. Both are MIT licensed and support React 19 natively. Your choice depends on whether you want full control or quick deployment.

### Is Intro.js really free?

Intro.js uses an AGPL-3.0 license, which means commercial projects must either open-source their entire codebase or purchase a commercial license starting at $9.99. For non-commercial or open-source projects, it's genuinely free. For SaaS products, it's effectively a paid library with a trial.

### Which product tour library has the smallest bundle size?

Driver.js is the smallest at approximately 5KB gzipped. userTourKit's core is under 8KB gzipped. React Joyride is the heaviest at roughly 30KB gzipped. For mobile-first apps where every kilobyte affects Core Web Vitals, bundle size should weight heavily in your decision.

### Do any open-source tour libraries support WCAG 2.1 AA?

As of April 2026, userTourKit is the only open-source product tour library that claims WCAG 2.1 AA compliance with documented ARIA roles, focus management, keyboard navigation, and `prefers-reduced-motion` support. Other libraries offer partial accessibility (keyboard nav in Shepherd.js, accessible overlays in Reactour) but none publish formal compliance documentation.

### Can I use these libraries with Next.js App Router?

React Joyride, userTourKit, OnboardJS, and Reactour all work with Next.js App Router. Onborda is built specifically for it. Shepherd.js and Driver.js work via dynamic imports with `'use client'` directives. Intro.js requires a client-side wrapper. The main gotcha is server components: tour logic must run on the client.
