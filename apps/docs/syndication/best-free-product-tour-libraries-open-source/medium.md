# Best Free Product Tour Libraries in 2026 (Open Source Only)

### We installed 9 open-source libraries into the same React 19 project. Here's what actually works.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-free-product-tour-libraries-open-source)*

---

**Import instructions:** Use medium.com/p/import and paste the URL https://usertourkit.com/blog/best-free-product-tour-libraries-open-source -- Medium will auto-set the canonical tag.

**Submit to:** JavaScript in Plain English publication for wider reach.

**Notes for Medium adaptation:**
- Remove the comparison table (doesn't render well on Medium) -- replace with the condensed prose version below
- Keep code blocks under 20 lines (Medium has no syntax highlighting)
- Remove all image tags and use Medium's image uploader instead
- Remove FAQ section -- link back to the original

---

Most "best product tour" roundups mix SaaS platforms charging $249/month with open-source libraries you can npm install for free. That makes comparison useless if you've already decided to own your code. This list covers only libraries with a real open-source license, an active maintainer, and a published npm package you can install today.

We installed each library into a Vite 6 + React 19 + TypeScript 5.7 project and built a 5-step tour targeting a sidebar, a button, and a modal. We measured bundle size via bundlephobia, checked TypeScript coverage, tested keyboard navigation, and verified the license in package.json.

**Bias disclosure:** We built userTourKit, so it's listed first. We've tried to be fair with every entry. Every claim below is verifiable against npm, GitHub, and bundlephobia.

## The quick rundown

Here's how the 9 libraries stack up: userTourKit (under 8KB, MIT, headless, WCAG 2.1 AA), React Joyride (~30KB, MIT, drop-in UI), Shepherd.js (~25KB, MIT, multi-framework), Driver.js (~5KB, MIT, highlight-focused), Reactour (~12KB, MIT, simple sequential), OnboardJS (~10KB, MIT core, state machine), Onborda (~8KB, MIT, Next.js-specific), Intro.js (~10KB, **AGPL -- commercial trap**), and GuideChimp (~15KB, MIT, multi-page tours).

## How we evaluated

We scored against six criteria: bundle size (20%), TypeScript support (20%), React 19 compatibility (15%), accessibility (20%), maintenance activity (15%), and license clarity (10%). We weighted accessibility at 20% because no other roundup in this space evaluates it at all.

## 1. userTourKit: best for teams with a design system

userTourKit is a headless React product tour library that ships as 10 composable packages at under 8KB gzipped for the core. It renders with your existing components (shadcn/ui, Radix, Tailwind, anything) instead of shipping its own UI. React 18 and 19 are supported natively, with TypeScript strict mode throughout.

Headless architecture means zero style conflicts. The asChild pattern works with both Radix UI and Base UI, so your tour tooltips look identical to the rest of your app.

Strengths: 10 packages installed individually, WCAG 2.1 AA compliance, built-in analytics plugin system, prefers-reduced-motion respected by default.

Limitations: requires React developers, younger project, no React Native support.

Pricing: Free (MIT). Pro features available for $99 one-time.

## 2. React Joyride: best for quick drop-in tours

The most downloaded React tour library on npm with 758K weekly downloads. Ships pre-built tooltip UI using react-floater. Version 3.0.2 added built-in TypeScript types and React 19 support.

Strengths: largest community, pre-built UI gets you working in 10 minutes, controlled and uncontrolled modes.

Limitations: opinionated styling clashes with Tailwind, no headless mode, ~30KB gzipped, no analytics or checklists.

Pricing: Free (MIT).

## 3. Shepherd.js: best for multi-framework teams

Framework-agnostic tour library with 13K+ GitHub stars and 100+ contributors. Ships adapters for React, Vue, Angular, and Ember. Maintained professionally by Ship Shape.

Strengths: framework-agnostic, 170+ releases, keyboard navigation, clean API.

Limitations: React wrapper adds a DOM abstraction layer, ships its own CSS, ~25KB gzipped.

Pricing: Free (MIT).

## 4. Driver.js: best for lightweight element highlighting

The smallest library on this list at roughly 5KB gzipped. TypeScript-first with SVG overlays for element highlighting.

Strengths: smallest bundle, beautiful spotlight animations, TypeScript-first.

Limitations: no React integration (direct DOM manipulation), no component composition, highlight-focused not tour-focused.

Pricing: Free (MIT).

## 5. Reactour: best for simple sequential tours

React-native tour library. Define steps as an array with selectors and content, wrap your app in a provider, done. About 1,600 GitHub stars.

Strengths: simple API, accessible overlay behavior, ~12KB gzipped.

Limitations: limited customization, no headless mode, TypeScript via DefinitelyTyped.

Pricing: Free (MIT).

## 6. OnboardJS: best for state machine architecture

Headless onboarding framework using a state machine approach. Ships with built-in analytics plugins for PostHog and Supabase.

Strengths: headless architecture, built-in analytics, state machine prevents impossible tour states.

Limitations: newer project, $59/month for advanced SaaS features, documentation still maturing.

Pricing: Free (MIT core) + $59/month for SaaS features.

## 7. Onborda: best for Next.js App Router

Built specifically for Next.js App Router. Handles server components, client boundaries, and Framer Motion animations.

Strengths: native Next.js App Router integration, Framer Motion animations, TypeScript built-in.

Limitations: Next.js only, no analytics or checklists, limited documentation.

Pricing: Free (MIT).

## 8. Intro.js: the AGPL licensing trap

Ships at ~10KB with zero dependencies and keyboard navigation. But the license is AGPL-3.0 -- any commercial project must either open-source their entire application or purchase a commercial license starting at $9.99.

Most "free tour library" roundups include Intro.js without flagging this. If you're building a SaaS product, Intro.js isn't free: it's a trial.

Pricing: Free for non-commercial use (AGPL). Commercial license from $9.99.

## 9. GuideChimp: best for multi-page tours

99 releases and active maintenance. Standout feature: multi-page tour support that persists across navigations.

Pricing: Free (MIT).

## The accessibility gap

Almost no open-source tour library claims WCAG 2.1 AA compliance. Shepherd.js mentions keyboard navigation. Reactour has accessible overlays. None publish Lighthouse scores or document ARIA role usage. Not one mentions prefers-reduced-motion.

userTourKit scores Lighthouse 100 for accessibility with focus management, ARIA roles, keyboard navigation, and prefers-reduced-motion support.

## How to choose

Choose a headless library (userTourKit, OnboardJS) if you want UI that matches your design system. Choose an opinionated library (React Joyride, Shepherd.js) for quick setup. Choose Driver.js for lightweight highlights. Choose Onborda for Next.js App Router. Avoid AGPL libraries (Intro.js) in commercial projects.

The full comparison table and FAQ are in the [original article](https://usertourkit.com/blog/best-free-product-tour-libraries-open-source).
