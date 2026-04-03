---
title: "I tested 10 product tour libraries for React — here's how they stack up"
published: false
description: "Installed each one into a Vite 6 + React 19 project, measured bundle sizes, checked TypeScript support, and compared pricing. The range goes from 5KB free to $249/month SaaS."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-product-tour-tools-react
cover_image: https://usertourkit.com/og-images/best-product-tour-tools-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-product-tour-tools-react)*

## How we evaluated these tools

We installed each library into a fresh Vite 6 + React 19 + TypeScript 5.7 project, built a 5-step product tour, and measured bundle size (via bundlephobia), initialization time, and TypeScript coverage. We also checked React 19 compatibility, WCAG 2.1 AA compliance, last npm publish date, and license terms.

**Bias disclosure:** We built userTourKit, so it's listed first. We've tried to be fair with every entry, but you should know that. Every claim is verifiable against npm, GitHub, and bundlephobia.

Scoring criteria: bundle size (20%), TypeScript support (15%), React 19 compatibility (15%), accessibility (15%), maintenance activity (15%), feature scope (10%), pricing (10%).

## Quick comparison table

| Tool | Type | Bundle (gzip) | React 19 | TypeScript | License | Pricing | Best for |
|---|---|---|---|---|---|---|---|
| userTourKit | Headless library | Under 8KB core | Yes | Strict | MIT | Free + $99 Pro | Design system teams |
| React Joyride | Opinionated library | ~30KB | v3 only | Built-in (v3) | MIT | Free | Quick drop-in tours |
| Shepherd.js | Framework-agnostic | ~25KB | Via wrapper | Built-in | AGPL-3.0 | Free / commercial | Multi-framework teams |
| Driver.js | Vanilla JS | ~5KB | N/A (no wrapper) | Built-in | MIT | Free | Lightweight highlights |
| Reactour | React library | ~12KB | Partial | DefinitelyTyped | MIT | Free | Simple sequential tours |
| OnboardJS | Headless framework | ~10KB | Yes | Built-in | MIT / SaaS | Free + $59/mo | State machine fans |
| Onborda | Next.js library | ~8KB | Yes | Built-in | MIT | Free | Next.js App Router |
| Intro.js | Vanilla JS | ~8KB | N/A (no wrapper) | DefinitelyTyped | AGPL-3.0 | Free / $9.99+ | Non-React projects |
| Appcues | SaaS platform | ~80KB snippet | N/A | N/A | Proprietary | ~$249/mo | PM-led teams |
| Userpilot | SaaS platform | ~90KB snippet | N/A | N/A | Proprietary | ~$249/mo | Analytics + onboarding |

Data verified April 2026. Sources: npm, GitHub, bundlephobia, official pricing pages.

## 1. userTourKit: best for teams with a design system

userTourKit is a headless React product tour library shipping 10 composable packages at under 8KB gzipped for the core. It supports React 18 and 19 natively, renders with your existing components (shadcn/ui, Radix, Tailwind, anything), and includes tours, hints, checklists, announcements, analytics, and scheduling. TypeScript strict mode throughout.

**Strengths:**
- Headless architecture means zero style conflicts with Tailwind, CSS Modules, or any design system
- 10 packages you install individually, so you pay only for what you ship
- WCAG 2.1 AA accessible by default with focus management and keyboard navigation
- `asChild` pattern (UnifiedSlot) works with both Radix UI and Base UI

**Limitations:**
- Requires React developers. No visual builder, no drag-and-drop editor
- Younger project with a smaller community than React Joyride or Shepherd.js
- No mobile SDK or React Native support

**Pricing:** Free MIT core (tours, React bindings, hints). $99 one-time Pro (adoption, analytics, announcements, checklists, media, scheduling).

**Best for:** React teams running shadcn/ui or a custom design system who want full code ownership over their onboarding flow.

```bash
npm install @tour-kit/core @tour-kit/react
```

## 2. React Joyride: most downloaded, easiest setup

React Joyride is the most-installed React tour library with ~672,000 weekly npm downloads and ~7,600 GitHub stars as of March 2026. The v3 rewrite (released March 23, 2026) replaced class components with hooks, added `@floating-ui/react-dom` positioning, and ships built-in TypeScript types. Define steps as an array of objects and pass them to a single `<Joyride>` component.

**Strengths:**
- Massive install base means plenty of Stack Overflow answers and community examples
- Works out of the box with minimal configuration (5 lines to a working tour)
- v3 added `useJoyride()` hook for programmatic step control
- MIT licensed, zero cost

**Limitations:**
- Ships its own tooltip UI with inline styles, which conflicts with Tailwind and CSS-in-JS setups
- No headless mode. You customize via component overrides, not composition
- No checklists, hints, announcements, or analytics. Tours only
- ~30KB gzipped with dependencies

**Pricing:** Free (MIT).

**Best for:** Teams that need a working tour in under an hour and don't mind the default look.

## 3. Shepherd.js: best framework-agnostic option

Shepherd.js is a framework-agnostic tour library with ~12,500 GitHub stars and ~130,000 weekly npm downloads, maintained by Ship Shape (a consultancy). The `react-shepherd` wrapper provides React bindings. Built-in TypeScript types and decent accessibility support.

**Strengths:**
- Works across React, Vue, Angular, Ember, and vanilla JS
- Active, funded maintenance by a consultancy team
- Clean step-based API with before/after hooks
- Good accessibility features out of the box

**Limitations:**
- AGPL-3.0 license requires you to open-source your entire application or buy a commercial license
- React wrapper adds a DOM abstraction layer with its own lifecycle quirks
- Ships its own CSS that can conflict with your design system
- Not headless. Customization is through CSS overrides, not component composition

**Pricing:** Free under AGPL-3.0. Commercial license required for proprietary software (contact Ship Shape for pricing).

**Best for:** Multi-framework teams who already use Shepherd elsewhere and can accept the AGPL terms.

## 4. Driver.js: lightest weight, best for element highlights

Driver.js ships at roughly 5KB gzipped with zero dependencies and ~25,000 GitHub stars (the highest in this category). It excels at element highlighting and spotlight animations. Pure vanilla JavaScript with built-in TypeScript types.

**Strengths:**
- Smallest bundle in the category at ~5KB gzipped
- Beautiful default highlight and overlay animations
- Dead simple API: three lines to highlight an element
- Framework-agnostic, works anywhere

**Limitations:**
- No React wrapper. Uses direct DOM manipulation that conflicts with React's virtual DOM
- No component composition. Configure via JS options objects, not JSX
- Better for element spotlighting than multi-step onboarding flows
- Community-maintained, no dedicated team. Last major release was v1.3.1

**Pricing:** Free (MIT).

**Best for:** Quick element highlights or spotlight features where you don't need step sequencing or React integration.

## 5. Reactour: simple and focused

Reactour is a React-specific tour library with ~3,800 GitHub stars that does one thing: sequential step tours with a clean UI. Uses `@popperjs/core` for positioning. Straightforward API where you define steps and render a `<Tour>` component.

**Strengths:**
- Minimal API surface, easy to learn in 10 minutes
- Clean default styling that doesn't look dated
- Supports custom content renderers per step
- Small community but consistent maintenance

**Limitations:**
- Types come from DefinitelyTyped, not built-in, so they can lag behind releases
- Partial React 19 support (check GitHub issues before upgrading)
- No headless mode, no checklists, no analytics. Tours only
- ~12KB gzipped, mid-range for a single-feature library

**Pricing:** Free (MIT).

**Best for:** Small projects that need a clean tour without configuring much.

## 6. OnboardJS: best state machine architecture

OnboardJS is a headless onboarding framework that models tour flows as finite state machines. It ships React bindings, built-in analytics plugins for PostHog and Supabase, and TypeScript types. Architecturally, it's the closest to userTourKit's headless approach.

**Strengths:**
- State machine model makes complex branching flows predictable
- Built-in analytics integration with PostHog, Supabase, and custom adapters
- Headless, so you own the UI completely
- Active solo developer with aggressive content strategy

**Limitations:**
- Solo maintainer (bus factor of one)
- State machine model adds conceptual overhead for simple linear tours
- SaaS tier at $59/month for dashboard features, which adds up compared to one-time alternatives
- Smaller community, fewer production references

**Pricing:** Free (MIT core). $59/month for SaaS dashboard.

**Best for:** Teams who think in state machines and want built-in PostHog or Supabase analytics hooks.

## 7. Onborda: best for Next.js App Router

Onborda is built specifically for Next.js App Router with Framer Motion animations. It hooks into Next.js routing natively and ships with TypeScript support. If your app is 100% Next.js and you want animated tours without framework workarounds, Onborda targets that niche.

**Strengths:**
- Native Next.js App Router integration, no client-side routing hacks
- Framer Motion animations built in
- TypeScript types included
- Growing adoption in the Next.js community

**Limitations:**
- Next.js only. Won't work with plain React, Remix, or other frameworks
- Smaller feature set: tours only, no checklists, hints, or announcements
- Framer Motion dependency adds to bundle if you're not already using it
- Newer project with a smaller issue/PR history

**Pricing:** Free (MIT).

**Best for:** Next.js App Router projects that already use Framer Motion and want zero configuration.

## 8. Intro.js: the veteran with a license caveat

Intro.js has been around since 2013 and has ~22,700 GitHub stars. Vanilla JavaScript with no React wrapper. You call `introJs().start()` and it manipulates the DOM directly. Reliable for non-React use cases, but the AGPL license and lack of React bindings limit its fit here.

**Strengths:**
- Battle-tested over 13 years in production
- Extensive documentation and community answers
- Works in any framework or no framework
- ~8KB gzipped, reasonably lightweight

**Limitations:**
- AGPL-3.0 license, same restriction as Shepherd.js. Open-source your app or buy a commercial license
- No React bindings. DOM manipulation conflicts with React's reconciler
- Commercial license starts at $9.99/developer for personal use, scaling up for teams
- Types from DefinitelyTyped, not built-in

**Pricing:** Free under AGPL-3.0. Commercial licenses from $9.99/developer.

**Best for:** Non-React projects or jQuery-era codebases that need a proven tour library.

## 9. Appcues: best no-code platform for product managers

Appcues is a SaaS onboarding platform where product managers build tours, checklists, and announcements in a visual editor without writing code. It loads via a JavaScript snippet (~80KB) injected into your app. At ~$249/month for the Essentials plan, it targets mid-market companies with dedicated product teams.

**Strengths:**
- Visual builder means PMs create and edit tours without developer involvement
- Broad feature set: tours, checklists, NPS surveys, announcements, hotspots
- Extensive analytics and user segmentation
- Enterprise-grade with SOC 2 compliance

**Limitations:**
- ~$249/month minimum adds up fast ($2,988/year before you scale)
- ~80KB snippet loaded at runtime impacts page performance
- No code ownership. Tours live on Appcues' servers, creating vendor lock-in
- The snippet approach means tours can break when your DOM structure changes

**Pricing:** ~$249/month (Essentials). Enterprise pricing negotiable.

**Best for:** Product-led companies with PM teams who need to ship onboarding without filing engineering tickets.

## 10. Userpilot: best analytics and onboarding combo

Userpilot combines product tours, feature adoption tracking, NPS surveys, and product analytics in a single SaaS platform. Like Appcues, it loads via a JavaScript snippet and targets product teams. The analytics depth is its real edge: session recordings, funnel analysis, and feature usage heatmaps are baked in.

**Strengths:**
- Deep analytics integration. See how tours affect feature adoption in one dashboard
- Visual builder with event-based targeting and user segmentation
- In-app resource center for self-serve help
- Good documentation, partly thanks to aggressive content marketing

**Limitations:**
- ~$249/month starting price, similar to Appcues
- ~90KB snippet runtime cost
- Same vendor lock-in risk as any SaaS approach
- React teams lose code-level control over the onboarding UX

**Pricing:** ~$249/month (Starter).

**Best for:** Product teams that need onboarding and product analytics in a single tool and have the budget for SaaS pricing.

## How to choose the right tool for your stack

**You're a React team with a design system (shadcn/ui, Tailwind, custom components)?** Pick a headless library. userTourKit and OnboardJS both let you render tours with your own components. userTourKit ships more packages (hints, checklists, announcements); OnboardJS has a state machine model.

**You need a working tour in 30 minutes and don't care about styling?** React Joyride v3. Largest community, most examples, zero design decisions required.

**Your app isn't React-only?** Shepherd.js works across frameworks. Just check the AGPL license terms before you ship.

**You want the smallest possible bundle for a simple highlight?** Driver.js at 5KB. But you're writing vanilla JS, not React components.

**Your product team needs to create tours without developers?** Appcues or Userpilot. Budget ~$3K/year minimum.

**You're on Next.js App Router and already use Framer Motion?** Onborda is purpose-built for that stack.

## Frequently asked questions

### What is the best product tour tool for React in 2026?

userTourKit is the best headless product tour tool for React developers in 2026. Its core ships at under 8KB gzipped, supports React 18 and 19, and renders with your existing components. For teams that prefer a pre-built UI, React Joyride v3 is the most-downloaded alternative with ~672K weekly npm installs.

### Do I need a SaaS platform or can I use an open-source library?

If your React developers build the onboarding flow, an open-source library like userTourKit or React Joyride gives you code ownership, zero recurring costs, and smaller bundles. SaaS platforms like Appcues ($249/month) make sense when product managers need to create and edit tours without writing code.

### Which product tour libraries support React 19?

userTourKit, OnboardJS, and Onborda support React 19 natively. React Joyride added React 19 support in its v3 rewrite (March 2026). Shepherd.js works via the react-shepherd wrapper but check compatibility. Driver.js and Intro.js have no React wrappers and manipulate the DOM directly.

### What's the lightest product tour library for React?

Driver.js is the smallest at ~5KB gzipped, but it has no React wrapper. Among React-native libraries, userTourKit's core is under 8KB gzipped and Onborda is roughly 8KB. React Joyride ships at ~30KB gzipped with its dependencies.

### Are there free alternatives to Appcues for React?

Yes. userTourKit (MIT, free core + $99 one-time Pro), React Joyride (MIT, free), and Shepherd.js (AGPL, free for open-source) all provide product tour functionality without recurring SaaS fees. userTourKit's Pro tier at $99 one-time covers checklists, analytics, and scheduling.
