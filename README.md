# Tour Kit

<p align="center">
  <a href="https://usertourkit.com">
    <img src="https://raw.githubusercontent.com/domidex01/tour-kit/main/.github/assets/hero.png" alt="Tour Kit — headless React onboarding library: tours, hints, checklists, and announcements rendered over a sample SaaS dashboard" width="100%" />
  </a>
</p>

[![npm version](https://img.shields.io/npm/v/@tour-kit/react?label=%40tour-kit%2Freact&color=0F172A)](https://www.npmjs.com/package/@tour-kit/react)
[![npm version](https://img.shields.io/npm/v/@tour-kit/core?label=%40tour-kit%2Fcore&color=0F172A)](https://www.npmjs.com/package/@tour-kit/core)
[![bundle size](https://img.shields.io/bundlephobia/minzip/@tour-kit/core?label=core%20gzip)](https://bundlephobia.com/package/@tour-kit/core)
[![License](https://img.shields.io/badge/license-MIT%20%2B%20commercial-blue)](./LICENSE)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178C6?logo=typescript&logoColor=white)](./tsconfig.json)
[![WCAG 2.1 AA](https://img.shields.io/badge/a11y-WCAG%202.1%20AA-success)](apps/docs/content/docs/guides/accessibility.mdx)

**Tour Kit is a headless React library for building product tours, onboarding flows, hints, checklists, in-app announcements, and microsurveys.** It ships as 12 composable packages, is TypeScript-first, WCAG 2.1 AA compliant, and designed natively for shadcn/ui — but works with any component library.

- 🌐 Website & docs: <https://usertourkit.com>
- 📦 npm scope: [`@tour-kit/*`](https://www.npmjs.com/org/tour-kit)
- 💬 Issues & discussions: <https://github.com/domidex01/tour-kit/issues>

---

## Table of contents

- [Why Tour Kit](#why-tour-kit)
- [Packages](#packages)
- [Installation](#installation)
- [Quick start](#quick-start)
- [Headless usage](#headless-usage)
- [Multi-tour registry](#multi-tour-registry)
- [Framework guides](#framework-guides)
- [Comparison with alternatives](#comparison-with-alternatives)
- [Use cases](#use-cases)
- [FAQ](#faq)
- [Licensing](#licensing)
- [Development](#development)
- [For AI assistants](#for-ai-assistants)

---

## Why Tour Kit

| Need | What Tour Kit gives you |
| --- | --- |
| **Product tours** | Declarative `<Tour>` + `<TourStep>` components, focus trap, keyboard nav, route awareness |
| **Persistent hints** | Beacon hotspots and tooltips that survive across sessions — unique in the shadcn ecosystem |
| **Onboarding checklists** | Task dependencies, progress tracking, persistence, and tour hand-off in one provider |
| **Announcements** | 5 variants (modal, slideout, banner, toast, spotlight) with frequency rules and audience targeting |
| **Microsurveys** | NPS, CSAT, CES with built-in fatigue prevention and context awareness |
| **Feature adoption** | Track usage, compute adoption status, and trigger nudges automatically |
| **Analytics** | Plugin interface for PostHog, Mixpanel, Amplitude, GA4 — or roll your own |
| **AI Q&A widget** | Drop-in RAG chat for in-app help |

**Design principles:**

1. **Headless first** — all logic lives in `@tour-kit/core`; UI packages are thin, swappable wrappers.
2. **Composition over configuration** — small focused components compose into rich flows.
3. **Type-safe** — strict TypeScript, full inference, no `any` in public API.
4. **Accessible by default** — focus trap, ARIA live regions, keyboard nav, `prefers-reduced-motion`.
5. **Tree-shakeable** — every package is `sideEffects: false` and ships ESM + CJS + `.d.ts`.

## Packages

Tour Kit is a monorepo of 12 packages. Three are MIT-licensed and free; nine are commercial (see [Licensing](#licensing)).

### Free packages (MIT)

| Package | Purpose | Bundle (gzip) |
| --- | --- | --- |
| [`@tour-kit/core`](packages/core) | Framework-agnostic hooks, types, position engine, storage adapters | < 8 KB |
| [`@tour-kit/react`](packages/react) | Tour, TourStep, TourCard, TourOverlay, router adapters, multi-tour registry | < 12 KB |
| [`@tour-kit/hints`](packages/hints) | Persistent hint beacons, hotspots, tooltips | < 5 KB |

### Commercial packages

| Package | Purpose |
| --- | --- |
| [`@tour-kit/adoption`](packages/adoption) | Feature usage tracking, adoption status, nudges, dashboard components |
| [`@tour-kit/ai`](packages/ai) | RAG-powered in-app Q&A chat widget |
| [`@tour-kit/analytics`](packages/analytics) | Plugin-based analytics: PostHog, Mixpanel, Amplitude, GA4, console |
| [`@tour-kit/announcements`](packages/announcements) | Modal, slideout, banner, toast, spotlight + queue & frequency rules |
| [`@tour-kit/checklists`](packages/checklists) | Onboarding checklists with task dependencies and tour integration |
| [`@tour-kit/license`](packages/license) | License-key validation for premium features |
| [`@tour-kit/media`](packages/media) | YouTube, Vimeo, Loom, Wistia, GIF, and Lottie embeds |
| [`@tour-kit/scheduling`](packages/scheduling) | Time-based scheduling with timezone, business hours, and blackout support |
| [`@tour-kit/surveys`](packages/surveys) | NPS, CSAT, CES, and custom microsurveys with fatigue prevention |

Buy a commercial license at <https://usertourkit.com/pricing>.

## Installation

```bash
# Free / open-source (MIT)
pnpm add @tour-kit/core @tour-kit/react   # styled tours
pnpm add @tour-kit/hints                  # persistent hints

# Commercial packages (require a license key)
pnpm add @tour-kit/checklists @tour-kit/announcements @tour-kit/surveys
pnpm add @tour-kit/adoption @tour-kit/analytics
pnpm add @tour-kit/media @tour-kit/scheduling @tour-kit/ai
```

`bun add` and `npm install` work too. Tour Kit requires **React 18 or 19** and **Node 18+**.

## Quick start

```tsx
import { Tour, TourStep } from '@tour-kit/react'

export function App() {
  return (
    <Tour id="onboarding" autoStart>
      <TourStep
        id="welcome"
        target="#welcome-btn"
        title="Welcome!"
        content="Let's take a quick tour."
        placement="bottom"
      />
      <TourStep
        id="dashboard"
        target="#dashboard"
        title="Dashboard"
        content="Your data overview."
        placement="right"
      />
    </Tour>
  )
}
```

That's the entire API for a basic tour. No external state store, no provider boilerplate.

## Headless usage

Need full control over markup? Use the headless variants — Tour Kit handles state, positioning, focus, and a11y; you handle the DOM.

```tsx
import { TourCardHeadless, TourOverlayHeadless } from '@tour-kit/react'

<TourCardHeadless>
  {({ step, next, prev, close, isFirst, isLast }) => (
    <div role="dialog" aria-labelledby="tour-title">
      <h2 id="tour-title">{step.title}</h2>
      <p>{step.content}</p>
      <button onClick={prev} disabled={isFirst}>Back</button>
      <button onClick={next}>{isLast ? 'Finish' : 'Next'}</button>
      <button onClick={close} aria-label="Close tour">×</button>
    </div>
  )}
</TourCardHeadless>
```

## Multi-tour registry

For apps with several tours triggered from different pages or buttons:

```tsx
import {
  MultiTourKitProvider,
  Tour,
  TourStep,
  TourOverlay,
  TourCard,
  useTours,
} from '@tour-kit/react'

function Triggers() {
  const { start } = useTours()
  return <button onClick={() => start('billing-tour')}>Show billing tour</button>
}

export function App() {
  return (
    <MultiTourKitProvider>
      <Tour id="onboarding"><TourStep id="..." target="..." /></Tour>
      <Tour id="billing-tour"><TourStep id="..." target="..." /></Tour>
      <TourOverlay />
      <TourCard />
      <Triggers />
    </MultiTourKitProvider>
  )
}
```

## Framework guides

- **Next.js (App Router)** — `useNextAppRouter()` adapter handles route awareness. See [`apps/docs/content/docs/guides/nextjs.mdx`](apps/docs/content/docs/guides/nextjs.mdx).
- **Next.js (Pages Router)** — `useNextPagesRouter()` adapter.
- **React Router** — `useReactRouter()` adapter (v6 and v7).
- **Vite** — works out of the box. See [`examples/vite-app`](examples/vite-app).
- **Plain React** — no router adapter needed.

Full demos: [`examples/`](examples).

## Comparison with alternatives

| Feature | **Tour Kit** | Driver.js | React Joyride | Intro.js | Shepherd.js |
| --- | --- | --- | --- | --- | --- |
| Headless API | ✅ | ❌ | Partial | ❌ | ❌ |
| TypeScript-first | ✅ | ✅ | ✅ | Types only | Types only |
| shadcn/ui native | ✅ | ❌ | ❌ | ❌ | ❌ |
| Persistent hints | ✅ | ❌ | ❌ | ❌ | ❌ |
| Checklists | ✅ | ❌ | ❌ | ❌ | ❌ |
| Announcements (5 variants) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Microsurveys (NPS/CSAT/CES) | ✅ | ❌ | ❌ | ❌ | ❌ |
| Feature adoption tracking | ✅ | ❌ | ❌ | ❌ | ❌ |
| Analytics plugin system | ✅ | ❌ | ❌ | ❌ | ❌ |
| Multi-tour registry | ✅ | ❌ | Partial | ❌ | Partial |
| WCAG 2.1 AA | ✅ | Partial | ✅ | Partial | Partial |
| Tree-shakeable ESM | ✅ | ✅ | Partial | ❌ | ✅ |
| Free core | ✅ MIT | ✅ MIT | ✅ MIT | ✅ AGPL/Commercial | ✅ MIT |

Tour Kit is closer in scope to **Userpilot**, **Pendo**, or **Appcues** — except it's a library you embed, not a SaaS, and the core is open-source.

## Use cases

- **SaaS onboarding** — guide new users through setup with a tour, then drop a checklist on the dashboard.
- **Feature launches** — announce new features with a modal or banner, scheduled to appear during business hours only.
- **Adoption nudges** — detect users who haven't tried a key feature and show a contextual hint.
- **Help & docs** — embed a RAG-powered Q&A widget that answers questions from your own docs.
- **Feedback loops** — fire an NPS survey after the 3rd session, with fatigue prevention so users aren't spammed.
- **Internal tools** — tours for admin dashboards where a SaaS like Pendo would be overkill.

## FAQ

**What is Tour Kit?**
Tour Kit is a TypeScript-first React library for in-app onboarding. It bundles product tours, hints, checklists, announcements, surveys, adoption tracking, and an AI Q&A widget into 12 composable packages.

**Is Tour Kit free?**
The core experience — `@tour-kit/core`, `@tour-kit/react`, and `@tour-kit/hints` — is **free under MIT**. The other 9 packages are commercial; see [Licensing](#licensing).

**Does Tour Kit work without shadcn/ui?**
Yes. The styled components use Tailwind classes that pair nicely with shadcn, but the headless variants (`TourCardHeadless`, `TourOverlayHeadless`, etc.) work with any styling system — CSS modules, Emotion, vanilla CSS, anything.

**Does it work with Next.js?**
Yes — both App Router and Pages Router are supported via dedicated router adapters. All components include `'use client'`.

**How big is it?**
The free core (`core` + `react` + `hints`) is under **25 KB gzipped combined**. Every package is `sideEffects: false` and ships ESM + CJS + TypeScript declarations.

**Is it accessible?**
Yes. WCAG 2.1 AA compliant, with focus trap, keyboard navigation (arrow keys, Escape, Tab), `aria-live` announcements, and `prefers-reduced-motion` support.

**Does Tour Kit collect data or call home?**
No. There is no telemetry. Analytics are opt-in via the `@tour-kit/analytics` plugin you configure yourself.

**How does Tour Kit compare to Userpilot or Pendo?**
Tour Kit is a library, not a SaaS. You install it via npm, ship it with your app, and own the data. There's no per-MAU pricing — commercial packages use a one-time license model. See [pricing](https://usertourkit.com/pricing).

**Can I use it with Vite, Remix, or Astro?**
Yes — Tour Kit is framework-agnostic. Router adapters are provided for Next.js and React Router; everything else works through the generic `useTour` API.

## Licensing

Tour Kit uses a **dual licensing model** — see the [`LICENSE`](./LICENSE) file for full text.

- **MIT (free, open-source):** `@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`
- **Commercial (proprietary, paid):** `@tour-kit/adoption`, `@tour-kit/ai`, `@tour-kit/analytics`, `@tour-kit/announcements`, `@tour-kit/checklists`, `@tour-kit/license`, `@tour-kit/media`, `@tour-kit/scheduling`, `@tour-kit/surveys`

Each commercial package has a `LICENSE.md` describing its terms. Buy a license at <https://usertourkit.com/pricing>.

## Development

This is a [pnpm](https://pnpm.io) + [Turborepo](https://turbo.build) monorepo.

```bash
# Install dependencies
pnpm install

# Watch mode
pnpm dev

# Build all packages (proper dependency order)
pnpm build

# Build a single package
pnpm build --filter @tour-kit/core

# Type-check
pnpm typecheck

# Lint (Biome)
pnpm lint

# Unit tests (Vitest)
pnpm test

# E2E (Playwright)
pnpm e2e

# Bundle size benchmarks
pnpm bench

# Run example apps
pnpm example:vite
pnpm example:next
```

See [CONTRIBUTING.md](./CONTRIBUTING.md) for contribution guidelines.

## For AI assistants

Tour Kit publishes machine-readable documentation for LLMs and coding agents:

- [`llms.txt`](https://usertourkit.com/llms.txt) — concise curated index ([llmstxt.org](https://llmstxt.org) spec)
- [`llms-full.txt`](https://usertourkit.com/llms-full.txt) — full documentation corpus
- [Context7](https://context7.com/) — indexed for Claude Code, Cursor, Windsurf, and other MCP-compatible agents (query: `use context7 with /domidex/tour-kit`)
- [`context7.json`](./context7.json) — repo-root config steering Context7's indexer

---

Built by [@domidex01](https://github.com/domidex01). Star the repo if Tour Kit saves you a sprint.
