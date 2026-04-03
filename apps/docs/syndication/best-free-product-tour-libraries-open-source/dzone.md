---
title: "9 Best Free Product Tour Libraries for Frontend Developers (2026 Open-Source Comparison)"
canonical_url: https://usertourkit.com/blog/best-free-product-tour-libraries-open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-free-product-tour-libraries-open-source)*

Most "best product tour" roundups mix SaaS platforms charging $249/month with open-source libraries you can install via npm for free. That makes comparison impractical if your organization has already decided to own the code. This list covers only libraries with a real open-source license, an active maintainer, and a published npm package available today.

We installed each library into a Vite 6 + React 19 + TypeScript 5.7 project and built a 5-step tour targeting a sidebar, a button, and a modal. We measured bundle size via bundlephobia, checked TypeScript coverage, tested keyboard navigation, and verified the license in `package.json`.

**Bias disclosure:** We built userTourKit, so it's listed first. We've tried to be fair with every entry. Every claim below is verifiable against npm, GitHub, and bundlephobia.

## How we evaluated these libraries

We scored each library against six criteria relevant to production frontend applications:

- **Bundle size (20%)**: gzipped weight from bundlephobia. Smaller is better for Core Web Vitals
- **TypeScript support (20%)**: built-in types vs DefinitelyTyped vs none
- **React 19 compatibility (15%)**: tested with `react@19.0.0`, not just claimed
- **Accessibility (20%)**: WCAG 2.1 AA compliance, keyboard navigation, ARIA roles, `prefers-reduced-motion` support
- **Maintenance activity (15%)**: last npm publish, open issues, commit frequency
- **License clarity (10%)**: MIT/Apache is genuinely free. AGPL has commercial restrictions that catch teams off guard

We weighted accessibility at 20% because accessible interactive components are a growing priority across frontend frameworks, and no other comparison in this space evaluates it.

## Quick comparison table

| Library | Bundle (gzip) | React 19 | TypeScript | License | Accessibility | Best for |
|---|---|---|---|---|---|---|
| userTourKit | Under 8KB core | Yes | Strict | MIT | WCAG 2.1 AA | Design system teams |
| React Joyride | ~30KB | v3 only | Built-in (v3) | MIT | Partial | Quick drop-in tours |
| Shepherd.js | ~25KB | Via wrapper | Built-in | MIT | Keyboard nav | Multi-framework teams |
| Driver.js | ~5KB | Via hooks | Built-in | MIT | Minimal | Lightweight highlights |
| Reactour | ~12KB | Yes | DefinitelyTyped | MIT | Partial overlays | Simple sequential tours |
| OnboardJS | ~10KB | Yes | Built-in | MIT | Not documented | State machine architecture |
| Onborda | ~8KB | Yes | Built-in | MIT | Not documented | Next.js App Router |
| Intro.js | ~10KB | Via wrapper | DefinitelyTyped | **AGPL** | Keyboard nav | Non-commercial projects |
| GuideChimp | ~15KB | Via wrapper | Partial | MIT | Minimal | Multi-page tours |

Data verified April 2026. Sources: npm, GitHub, bundlephobia, official docs.

## 1. userTourKit: best for teams with a design system

userTourKit is a headless React product tour library that ships as 10 composable packages at under 8KB gzipped for the core. It renders with your existing components instead of shipping its own UI. React 18 and 19 are supported natively, with TypeScript strict mode throughout. The library includes tours, hints, checklists, announcements, analytics, and scheduling in separate packages installed individually.

**Strengths:**
- 10 packages installed individually: you ship only what you use
- WCAG 2.1 AA compliance with focus management, ARIA roles, and keyboard navigation
- Built-in analytics plugin system (PostHog, Mixpanel, or custom)
- `prefers-reduced-motion` respected by default

**Limitations:**
- Requires frontend developers. No visual builder or drag-and-drop
- Younger project with a smaller community than React Joyride or Shepherd.js
- No React Native support

**Pricing:** Free (MIT). Pro features available for $99 one-time.

**Best for:** Frontend teams using a component library or custom design system who want full control over how tours render.

## 2. React Joyride: best for quick drop-in tours

React Joyride is the most downloaded React tour library on npm, with 758K weekly downloads and 7,682 GitHub stars as of April 2026. It ships pre-built tooltip UI using react-floater. Version 3.0.2 added built-in TypeScript types and React 19 support.

**Strengths:**
- Largest community: 44 contributors, 11K+ npm dependent projects
- Pre-built UI gets you from zero to working tour in under 10 minutes
- Controlled and uncontrolled modes for simple and complex use cases
- Active maintenance with v3 rewrite shipping in 2025-2026

**Limitations:**
- Opinionated styling clashes with utility-first CSS frameworks
- No headless mode
- Bundle size (~30KB gzipped) is 4x the lightest alternatives
- No built-in analytics, checklists, or scheduling

**Pricing:** Free (MIT).

## 3. Shepherd.js: best for multi-framework teams

Shepherd.js is a framework-agnostic tour library with 13K+ GitHub stars and 100+ contributors. It ships adapters for React, Vue, Angular, and Ember. Ship Shape, a consultancy, maintains it professionally.

**Strengths:**
- Framework-agnostic core with dedicated React, Vue, Angular wrappers
- 170+ releases, latest March 2026: consistently maintained
- Keyboard navigation support
- Step-based API is clean and well-documented

**Limitations:**
- React wrapper adds a DOM abstraction layer with its own lifecycle
- Ships its own CSS that can conflict with utility-first frameworks
- Bundle size (~25KB gzipped)
- No built-in analytics or checklist support

**Pricing:** Free (MIT).

## 4. Driver.js: best for lightweight element highlighting

Driver.js is the smallest library on this list at roughly 5KB gzipped. Built in TypeScript from the ground up with SVG overlays for element highlighting.

**Strengths:**
- Smallest bundle (~5KB gzipped)
- Beautiful default spotlight animations
- TypeScript-first codebase
- Works in any framework

**Limitations:**
- No React integration: uses direct DOM manipulation
- No component composition: configuration via JS objects
- Highlight-focused, not tour-focused
- No state management, analytics, or persistence

**Pricing:** Free (MIT).

## 5. Reactour: best for simple sequential tours

React-native tour library. Define steps as an array of objects with selectors and content, wrap your app in a provider, and the tour runs. About 1,600 GitHub stars and steady maintenance.

**Strengths:**
- Simple API
- Accessible overlay and mask behavior
- ~12KB gzipped
- React-native, not a framework wrapper

**Limitations:**
- Limited customization
- No headless mode
- TypeScript via DefinitelyTyped

**Pricing:** Free (MIT).

## 6. OnboardJS: best for state machine architecture

Headless onboarding framework using a state machine approach. Ships with built-in analytics plugins for PostHog and Supabase.

**Strengths:**
- Headless architecture
- Built-in analytics (PostHog, Supabase, Mixpanel)
- State machine approach prevents impossible tour states
- TypeScript-first

**Limitations:**
- Newer project with a smaller community
- SaaS pricing ($59/month) for advanced features
- Documentation still maturing

**Pricing:** Free (MIT core) + $59/month for SaaS features.

## 7. Onborda: best for Next.js App Router

Built specifically for Next.js App Router projects. Handles server components, client boundaries, and Framer Motion animations.

**Strengths:**
- Built for Next.js App Router (not retrofitted)
- Framer Motion animations included
- TypeScript built-in

**Limitations:**
- Next.js only
- No analytics, checklists, or scheduling
- Limited documentation

**Pricing:** Free (MIT).

## 8. Intro.js: the AGPL licensing consideration

Intro.js ships at ~10KB with zero dependencies and includes keyboard navigation. However, the license is AGPL-3.0, which means any commercial project using it must either open-source their entire application or purchase a commercial license starting at $9.99.

**This is a critical consideration for enterprise teams.** AGPL-3.0 requires that any software interacting with the library over a network must also be released under AGPL or a compatible license. Most organizations' legal teams will flag this during compliance review.

**Strengths:**
- Zero external dependencies
- Keyboard navigation and basic accessibility
- Works across frameworks via wrappers
- Small bundle (~10KB)

**Limitations:**
- AGPL license requires open-sourcing your application or purchasing a commercial license
- Commercial license scales with team size
- No React-native integration
- No TypeScript built-in

**Pricing:** Free for non-commercial use (AGPL). Commercial license from $9.99.

## 9. GuideChimp: best for multi-page tours

99 releases and active maintenance as of March 2026. Standout feature: multi-page tour support that persists across navigations.

**Strengths:**
- Multi-page tours that survive page navigations
- 99 releases, steady maintenance
- ~15KB gzipped, extensible plugin architecture

**Limitations:**
- Small community with limited documentation
- Partial TypeScript, minimal accessibility

**Pricing:** Free (MIT).

## The accessibility gap

Almost no open-source tour library claims WCAG 2.1 AA compliance. Shepherd.js mentions keyboard navigation. Reactour has accessible overlays. Intro.js claims "full accessibility support." None publish Lighthouse scores or document ARIA role usage. Not one mentions `prefers-reduced-motion`.

For organizations with accessibility requirements -- and that includes any enterprise serving public-sector clients or operating in the EU -- this gap is a compliance risk.

userTourKit scores Lighthouse 100 for accessibility with focus management, ARIA roles, keyboard navigation, and `prefers-reduced-motion` support, tested with axe-core on every build.

## How to choose the right library

**Choose a headless library (userTourKit, OnboardJS)** if your team has frontend developers and you want tour UI that matches your design system exactly.

**Choose an opinionated library (React Joyride, Shepherd.js)** if you need a working tour quickly and the default tooltip UI is acceptable.

**Choose a lightweight library (Driver.js)** if you primarily need element highlighting rather than full onboarding flows.

**Choose a framework-specific library (Onborda)** if you're committed to Next.js App Router.

**Avoid AGPL libraries (Intro.js) in commercial projects** unless your legal team has reviewed the implications and you're prepared to comply or purchase a commercial license. MIT is the safe default for enterprise use.

## Enterprise considerations

For enterprise teams evaluating these libraries, additional factors beyond the comparison table include: license compliance review (especially AGPL implications for network-facing applications), long-term maintenance commitments (funded maintainers vs. community-maintained), accessibility compliance documentation for SOC 2 and WCAG audits, and the availability of commercial support channels.

## FAQ

### What is the best free product tour library for React in 2026?

userTourKit and React Joyride are the two strongest free options. userTourKit is headless (under 8KB, WCAG 2.1 AA, works with any design system), while React Joyride ships pre-built UI for faster setup. Both are MIT licensed and support React 19.

### Is Intro.js really free?

Intro.js uses AGPL-3.0, which means commercial projects must either open-source their entire codebase or purchase a commercial license starting at $9.99. For non-commercial projects, it's genuinely free.

### Which product tour library has the smallest bundle size?

Driver.js at approximately 5KB gzipped. userTourKit's core is under 8KB. React Joyride is the heaviest at roughly 30KB.

### Do any open-source tour libraries support WCAG 2.1 AA?

As of April 2026, userTourKit is the only open-source product tour library that claims WCAG 2.1 AA compliance with documented ARIA roles, focus management, keyboard navigation, and `prefers-reduced-motion` support.

### Can I use these libraries with Next.js App Router?

React Joyride, userTourKit, OnboardJS, and Reactour all work with Next.js App Router. Onborda is built specifically for it. Shepherd.js and Driver.js work via dynamic imports with `'use client'` directives. Tour logic must run on the client.
