---
title: "Which product tour libraries actually support TypeScript? (2026)"
published: false
description: "We tested 8 tour libraries in a strict-mode TypeScript project. Only 3 compile clean. Here's the full breakdown."
tags: typescript, react, webdev, javascript
canonical_url: https://usertourkit.com/blog/product-tour-libraries-typescript-support
cover_image: https://usertourkit.com/og-images/product-tour-libraries-typescript-support.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/product-tour-libraries-typescript-support)*

# Which product tour libraries support TypeScript?

Most product tour libraries claim TypeScript support. Fewer actually deliver it. A library can ship `.d.ts` files and still resolve your step config to `any` after a minor version bump. Or silently drop generic support in a patch release.

We installed eight tour libraries into a Vite 6 + React 19 + TypeScript 5.7 strict-mode project and checked what actually works: autocomplete, generic step types, strict-mode compilation, and whether the types stay accurate across versions.

**Bias disclosure:** We built Tour Kit, so it appears in this comparison. Every claim is verifiable against npm, GitHub, and bundlephobia.

```bash
npm install @tourkit/core @tourkit/react
```

## Short answer

As of April 2026, six of the eight major product tour libraries ship with TypeScript support, but only three are written in TypeScript from the ground up with full strict-mode compatibility: Tour Kit, Driver.js, and Onborda. React Joyride is written in TypeScript but its `Step` type has [regressed to `any`](https://github.com/gilbarbara/react-joyride/issues/949) in recent versions. Shepherd.js retrofitted types but its React wrapper breaks under strict mode. Intro.js relies on community-maintained DefinitelyTyped declarations that lag behind releases.

## TypeScript support compared

Eight product tour libraries tested in a Vite 6 + React 19 + TypeScript 5.7 strict-mode project reveal that "TypeScript support" ranges from full native types with generics down to abandoned DefinitelyTyped stubs that haven't been updated in months. This table shows the actual state of each library's type system.

| Library | TS origin | Strict mode | Generic steps | React 19 | Bundle (gzip) | License |
|---------|-----------|-------------|---------------|----------|---------------|---------|
| Tour Kit | Native (strict) | ✅ | ✅ | ✅ | <8KB core | MIT |
| Driver.js | Native | ✅ | ❌ | ✅ (vanilla) | ~5KB | MIT |
| Onborda | Native | ✅ | ❌ | ✅ | ~8KB + Motion | MIT |
| React Joyride | Own declarations | ⚠️ Step → any | ❌ | ❌ (9 months stale) | ~30KB | MIT |
| Shepherd.js | Retrofitted | ⚠️ Wrapper broken | ❌ | ⚠️ Wrapper issues | ~25KB | MIT |
| NextStepjs | Native | ✅ | ❌ | ✅ | Small + Motion | MIT |
| Intro.js | @types (outdated) | ❌ | ❌ | ⚠️ Via wrapper | ~12.5KB | AGPL |
| Reactour | Has types | ⚠️ Partial | ❌ | ✅ | ~15KB | MIT |

Data verified April 2026. Sources: npm, GitHub, bundlephobia, package source inspection.

Three things jump out. First, "has TypeScript types" and "written in TypeScript" aren't the same thing. Shepherd.js has types, but its React wrapper (`react-shepherd`) throws compilation errors under `strict: true` because the underlying types weren't designed for strict mode. Second, only Tour Kit supports generic step types, meaning you can define custom metadata on steps and get typed access without casting. Third, React 19 compatibility remains a real problem: React Joyride hasn't published in nine months, and Intro.js depends on a community wrapper.

## What "TypeScript support" actually means

Product tour libraries fall into three tiers of TypeScript integration, and the tier determines whether you get real autocomplete, partial coverage, or types that silently lie about the runtime API. Not every library that ships `.d.ts` files gives you the same experience.

**Native TypeScript (best DX):** The library source code is TypeScript. Types evolve with the API. Autocomplete covers every config option, callback parameter, and return type. When the library adds a new feature, the types ship in the same release. Tour Kit, Driver.js, Onborda, and NextStepjs fall here.

**Own declarations (mixed results):** The source is TypeScript, but the type architecture has gaps. React Joyride is written in TypeScript, yet its `Step` type resolves to `any` in certain configurations ([GitHub #949](https://github.com/gilbarbara/react-joyride/issues/949)). You get autocomplete on the happy path but lose it at the edges.

**DefinitelyTyped (worst DX):** Types are maintained by the community, not the library author. They lag behind releases, miss API changes, and occasionally get abandoned. Intro.js falls here. As one developer noted on dev.to, "Strong type safety meant catching more mistakes instantly in the editor, reducing runtime bugs." That only holds when the types match the runtime.

## When to choose each library

The right product tour library depends on your framework, your TypeScript strictness, and whether you need generic step metadata, not on a ranked score. Pick based on your actual constraints.

**If you need strict-mode TypeScript with generic step types:** Tour Kit supports `useStep<MyStepData>()` with full type inference, something none of the other seven libraries offer. The headless architecture means your tooltips are your own React components, not opaque library renders. The tradeoff: no visual builder, React 18+ only, smaller community than Joyride or Shepherd.

**If you want vanilla JS with solid types:** Driver.js ships at roughly 5KB gzipped, zero dependencies, and compiles clean under strict mode. Framework-agnostic, so you give up React-specific hooks but gain portability. Good fit for multi-framework teams.

**If you're on Next.js App Router:** Onborda and NextStepjs are both built for the App Router pattern. Both TypeScript-native. Onborda pulls in Motion for animations, so factor that dependency into your bundle budget.

**If you have existing Joyride tours:** React Joyride's TypeScript has degraded, but it still works for simple configurations. Worth staying if your tours are stable and you aren't hitting the `Step` regression. Worth migrating if you need strict mode. We wrote a [migration guide from React Joyride](https://usertourkit.com/blog/migrate-react-joyride-tour-kit) if you decide to switch.

**If you need framework-agnostic positioning:** Shepherd.js has the most mature positioning engine. But budget time for TypeScript workarounds. The React wrapper's types don't match the core API in several places. Check [Shepherd.js issue #2869](https://github.com/shipshapecode/shepherd/issues/2869) before committing.

**If licensing matters:** Intro.js uses AGPL, which requires you to open-source your entire application if you distribute it. Every other library on this list uses MIT. That alone eliminates Intro.js for most commercial SaaS products.

## What we recommend

For teams starting new React projects in 2026, use a library that's TypeScript-native and React 19-compatible. That narrows the field to Tour Kit, Onborda, and NextStepjs for React-specific options, or Driver.js if you need framework flexibility.

Tour Kit is the only one with generic step types and headless rendering, which matters for design system teams who need full control over tooltip markup and styling. [Bits and Pieces](https://blog.bitsrc.io/5-strong-reasons-to-use-typescript-with-react-bc987da5d907) calls out type safety as essential for component libraries. The same logic applies to tour libraries that integrate with your component tree.

But be honest about the tradeoff: Tour Kit is a younger project with less community battle-testing than React Joyride (603K weekly downloads) or Shepherd.js (100K+). If your team values ecosystem maturity over TypeScript strictness, Joyride still works for basic configurations.

Start here:

```tsx
// src/components/ProductTour.tsx
import { TourProvider, useTour } from '@tourkit/react';

interface StepMeta {
  requiredRole: 'admin' | 'user';
  videoUrl?: string;
}

const steps = [
  {
    id: 'welcome',
    target: '#dashboard',
    title: 'Welcome to your workspace',
    content: 'Quick orientation, three steps.',
    meta: { requiredRole: 'user' } satisfies StepMeta,
  },
  {
    id: 'settings',
    target: '#settings-btn',
    title: 'Your settings',
    content: 'Customize notifications and preferences here.',
    meta: { requiredRole: 'admin', videoUrl: '/demos/settings.mp4' },
  },
] as const;

function Tour() {
  const { currentStep, next, isActive } = useTour();
  if (!isActive) return null;
  // currentStep.meta is fully typed, no any, no cast
  return (
    <div role="dialog" aria-label={currentStep.title}>
      <p>{currentStep.content}</p>
      <button onClick={next}>Next</button>
    </div>
  );
}
```

Explore the full API at [usertourkit.com](https://usertourkit.com/).

## FAQ

### Does React Joyride support TypeScript?

React Joyride is written in TypeScript, but its `Step` type resolves to `any` in certain configurations as of April 2026 ([GitHub #949](https://github.com/gilbarbara/react-joyride/issues/949)). Basic usage autocompletes, but custom step metadata loses type safety. React 19 compilation also fails due to nine months without a release.

### Which product tour library has the best TypeScript DX?

Tour Kit scores highest on TypeScript developer experience because it's the only product tour library with generic step types, full strict-mode compatibility, and headless rendering. Generic steps mean you define `useStep<MyStepData>()` and get typed metadata without casting. Driver.js is a close second for vanilla JS projects with clean types.

### Is Shepherd.js TypeScript compatible?

Shepherd.js core has TypeScript types, but the React wrapper (`react-shepherd`) breaks under `strict: true`. The types were retrofitted rather than native, and several config options don't match between the wrapper and core API. If you're using Shepherd in a React project with strict TypeScript, budget time for type workarounds.

### Can I use Intro.js with TypeScript?

Intro.js types come from DefinitelyTyped (`@types/intro.js`), not the library itself. They lag behind releases and miss API changes. More importantly, Intro.js uses AGPL licensing, which requires you to open-source your application if you distribute it. For commercial SaaS projects, this is typically a non-starter regardless of TypeScript support.

### What's the difference between native TypeScript and DefinitelyTyped?

Native TypeScript means the library source is TypeScript. Types ship with the package, stay synchronized with the API, and work under strict mode. DefinitelyTyped means community volunteers maintain separate definitions that lag behind releases by weeks or months. Native catches API drift automatically; DefinitelyTyped requires someone to notice and submit a PR.
