---
title: "8 onboarding tools for developer platforms, compared by bundle size and accessibility"
published: false
description: "We tested 8 onboarding tools by building the same 3-step flow in React 19 + TypeScript. Here's every bundle size, pricing model, and WCAG score."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/best-onboarding-tools-developer-platforms
cover_image: https://usertourkit.com/og-images/best-onboarding-tools-developer-platforms.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/best-onboarding-tools-developer-platforms)*

# 8 best onboarding tools for developer tools and dev platforms (2026)

Developer tools don't onboard like consumer SaaS. Your users read docs before they read tooltips. They want to see a code snippet, not a marketing video. They'll close a modal faster than they'll close a terminal window.

And yet most onboarding tools are built for product managers guiding non-technical users through form flows. If you're building a CLI, an API platform, a code editor plugin, or a developer dashboard, you need something different.

We tested eight tools by building the same three-step onboarding flow in a React 19 + TypeScript project: an API key setup, a first-request walkthrough, and a sandbox prompt. Here's what worked and what didn't.

```bash
npm install @tourkit/core @tourkit/react
```

*Full disclosure: Tour Kit is our project. We tested every tool on this list the same way, and we'll point out where competitors genuinely do things better. Every claim is verifiable against npm, GitHub, and bundlephobia.*

## How we evaluated these tools

We scored each tool across six criteria that matter specifically for developer platforms, not generic SaaS onboarding. Bundle size matters more when your users are already loading Monaco Editor. TypeScript support matters because your users *will* read your type definitions.

- Bundle size (gzipped) and dependency count
- TypeScript support (native types vs DefinitelyTyped vs none)
- React 19 compatibility (tested, not just claimed)
- Accessibility (WCAG 2.1 AA audit, keyboard navigation, screen reader support)
- Developer-specific features (code highlighting, API-aware flows, CLI onboarding)
- Pricing model and open-source license

We installed each library into a Vite 6 + React 19 + TypeScript 5.7 project, built the same onboarding flow, and measured first paint impact with Lighthouse.

## Quick comparison

| Tool | Type | Bundle size | TypeScript | React 19 | WCAG 2.1 AA | Pricing | Best for |
|------|------|-------------|------------|----------|-------------|---------|----------|
| Tour Kit | Headless library | <8 KB core | Native | Yes | Yes | Free (MIT) / $99 Pro | Design system integration |
| Driver.js | Library | ~5 KB gzip | Native | Partial | Partial | Free (MIT) | Lightweight highlighting |
| Shepherd.js | Library | ~30 KB | Supported | Partial | Partial | Free (MIT) | Full-featured OSS tours |
| React Joyride | React library | ~50 KB | Supported | Partial | Partial | Free (MIT) | Quick React prototyping |
| Frigade | Platform | SDK-based | Native | Yes | Not certified | Free tier / paid | Developer-led growth |
| Appcues | SaaS platform | ~200 KB+ | N/A | N/A | Not certified | $300/mo+ | No-code for product teams |
| Userpilot | SaaS platform | ~250 KB+ | N/A | N/A | Not certified | $249/mo+ | Analytics + onboarding |
| Chameleon | SaaS platform | ~150 KB+ | N/A | N/A | Not certified | Custom pricing | Deep UI customization |

Bundle sizes as of April 2026 via bundlephobia and vendor documentation. SaaS platform sizes are approximate SDK payloads.

## 1. Tour Kit: best for teams with a design system

Tour Kit is a headless onboarding library for React that gives you tour logic without prescribing any UI. The core ships at under 8 KB gzipped with zero runtime dependencies, providing hooks like `useTour()` and `useStep()` for positioning, state, keyboard navigation, and ARIA attributes. You render steps with your own components. If your developer platform uses shadcn/ui, Radix, or a custom design system, Tour Kit slots in instead of fighting it.

**Strengths:**
- Smallest bundle in this list: core < 8 KB, react < 12 KB gzipped
- 10 composable packages: install only what you need (analytics, surveys, checklists, scheduling)
- Native React 18 and 19 support with hooks-first API
- WCAG 2.1 AA compliant: focus trapping, `aria-live` announcements, `prefers-reduced-motion` support
- Works with any design system. No CSS overrides needed because there's no default CSS.

**Limitations:**
- No visual builder. You write JSX for every step.
- Smaller community than React Joyride or Shepherd.js.
- React only. No Vue, Angular, or vanilla JS bindings yet.

**Pricing:** Free and open source (MIT) for core packages. Pro features are $99 one-time.

```tsx
// src/components/ApiKeyTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

const steps = [
  { id: 'api-key', target: '#api-key-input', content: 'Paste your API key here' },
  { id: 'first-request', target: '#run-button', content: 'Hit Run to send your first request' },
  { id: 'response', target: '#response-panel', content: 'Your response appears here' },
];

function ApiKeyTour() {
  const { currentStep, next, isActive } = useTour();
  if (!isActive) return null;
  return (
    <div className="tour-step rounded-lg border bg-popover p-4 shadow-md">
      <p>{currentStep?.content}</p>
      <button onClick={next}>Next</button>
    </div>
  );
}
```

## 2. Driver.js: best for lightweight element highlighting

Driver.js is a 5 KB gzipped vanilla JavaScript library that highlights page elements with an animated overlay. Over 23,000 GitHub stars as of April 2026, TypeScript-first, zero dependencies. Does one thing well: drawing attention to elements. Complex multi-step flows or React state integration require extra work.

**Strengths:**
- Tiny bundle at ~5 KB gzipped, so it won't budge your Lighthouse score
- Zero dependencies. The entire library is self-contained.
- Clean TypeScript types shipped with the package

**Limitations:**
- No React hooks. You're calling `driver.highlight()` imperatively.
- Limited accessibility: keyboard navigation exists, but no ARIA live regions or focus trapping.

**Pricing:** Free and open source (MIT).

## 3. Shepherd.js: best full-featured open-source option

Shepherd.js is the most feature-complete open-source tour library, with over 13,000 GitHub stars and active maintenance as of April 2026. Multi-step tours, rich positioning via Floating UI, modal overlays, progress indicators, action hooks. The tradeoff is size: ~30 KB including the Floating UI dependency.

**Strengths:**
- Most mature OSS tour library with years of production usage
- Framework-agnostic with community wrappers for React, Vue, Angular, and Ember
- Rich step configuration: buttons, actions, scroll behavior, modal overlays

**Limitations:**
- 30 KB bundle adds up when your dev platform already loads heavy editor components
- No native React hooks. The React wrapper is community-maintained, not first-party.

**Pricing:** Free and open source (MIT).

## 4. React Joyride: best for quick React prototyping

React Joyride has 7,000+ GitHub stars and 603,000 weekly npm downloads as of April 2026. Drop in the component, define steps, and you have a working tour in under 30 minutes. But "styling and state orchestration can get messy at scale" ([Userorbit](https://userorbit.com/blog/best-open-source-product-tour-libraries)).

**Strengths:**
- Fastest time-to-first-tour for React projects
- Pre-built UI with reasonable defaults, useful for internal tools
- Large community means plenty of Stack Overflow answers

**Limitations:**
- 50 KB gzipped is significant for a developer platform
- Opinionated styling fights custom design systems
- No headless mode

**Pricing:** Free and open source (MIT).

## 5. Frigade: best platform for developer-led companies

Frigade positions itself as onboarding infrastructure for developer-led companies, shipping a React SDK with hooks and components you compose in code. It sits between a raw library and a full SaaS platform: checklists, announcements, surveys, and tours in a unified SDK.

**Strengths:**
- Code-first approach that feels natural for developer teams
- Built-in analytics, user targeting, and A/B testing
- Components are composable, closer to a library than a typical SaaS dashboard

**Limitations:**
- Vendor dependency. Your onboarding flows live in Frigade's infrastructure.
- Pricing is opaque with no public pricing page

**Pricing:** Free tier available. Paid plans require contacting sales.

## 6. Appcues: best no-code option for product teams

Appcues is the most recognized name in onboarding, with over 20 integrations and a visual builder that lets product managers create flows without developer involvement. Starting at $300 per month for 1,000 MAUs, the SDK injects roughly 200 KB+ of JavaScript.

**Strengths:**
- Visual flow builder means product managers can iterate without PRs
- 20+ integrations including Segment, Mixpanel, HubSpot, and Salesforce
- Mobile SDK support (iOS and Android) alongside web

**Limitations:**
- $300/month starting price is steep for early-stage developer tool companies
- 200 KB+ SDK payload is heavy for performance-conscious developer platforms

**Pricing:** Starts at $300/month for 1,000 MAUs.

## 7. Userpilot: best for analytics-heavy teams

Userpilot bundles onboarding flows with product analytics, session replays, and autocapture events starting at $249 per month. If your platform needs both onboarding and usage analytics in one tool, Userpilot saves you from integrating separate products.

**Strengths:**
- Built-in analytics suite eliminates the need for separate tools like Mixpanel
- Autocapture tracks events without manual instrumentation
- Session replay helps debug where users drop off in onboarding

**Limitations:**
- $249/month minimum means significant cost before you've validated your flow
- SDK payload runs ~250 KB+ which hurts Lighthouse scores
- Web-only. No mobile SDK.

**Pricing:** Starts at $249/month.

## 8. Chameleon: best for deep UI customization (SaaS)

Chameleon differentiates from Appcues and Userpilot with deeper CSS customization and AI-powered agents for proactive user guidance. As of April 2026, it's web-only and positions styling flexibility as a key advantage.

**Strengths:**
- Deeper CSS customization than Appcues, getting closer to a visual match with your UI
- AI agents that trigger contextual guidance based on user behavior
- HelpBar search widget for self-serve onboarding

**Limitations:**
- Web-only. No mobile SDK.
- Custom pricing isn't transparent and requires a sales conversation

**Pricing:** Custom pricing. No public tiers listed.

## How to choose the right onboarding tool for your developer platform

The decision comes down to three questions.

**Do your developers own onboarding, or does a product team?** If developers own it, pick a library (Tour Kit, Driver.js, Shepherd.js). You'll write code, but you control rendering, bundle size, and accessibility. If product managers own it, pick a platform (Appcues, Userpilot, Chameleon).

**How much does bundle size matter?** Developer tools already load heavy components. Monaco Editor is ~2 MB. Tour Kit at <8 KB won't move the needle. Appcues at 200 KB+ might.

**Do you need onboarding to match your design system?** Headless tools (Tour Kit) render with your components. Opinionated libraries (React Joyride, Shepherd.js) need CSS overrides. SaaS platforms generate their own UI that never quite matches.

Smashing Magazine documented how platformOS won an award by offering [three parallel routes](https://www.smashingmagazine.com/2022/05/developing-award-winning-onboarding-process-case-study/): non-technical, semi-technical, and technical. Your CLI power users and your dashboard-first users need different onboarding paths.

## FAQ

**What is the best onboarding tool for developer tools in 2026?**
Tour Kit is the best fit for developer tool platforms that need code-level control and design system integration. Ships at under 8 KB gzipped with WCAG 2.1 AA compliance. For teams wanting a managed platform, Frigade offers a code-first SDK for developer-led companies.

**Do I need a SaaS platform or can I use an open-source library?**
Open-source libraries work well when your engineering team owns onboarding and wants full control. SaaS platforms make sense when product managers need to create flows independently. Most developer tool companies choose libraries because their teams already work in code.

**How much do onboarding tools cost for developer platforms?**
Open-source options (Tour Kit, Shepherd.js, Driver.js) are MIT licensed and free. Tour Kit Pro is a one-time $99 payment. SaaS platforms start at $249-$300 per month, scaling with MAUs. For 5,000 MAUs, Appcues costs roughly $500-$800 per month.

---

Get started with Tour Kit for your developer platform:

```bash
npm install @tourkit/core @tourkit/react
```

[View documentation](https://tourkit.dev/docs) | [GitHub repository](https://github.com/AmanVarshney01/tour-kit) | [Live examples](https://tourkit.dev/docs/examples)
