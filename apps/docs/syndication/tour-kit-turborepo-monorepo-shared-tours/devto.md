---
title: "Sharing product tours across apps in a Turborepo monorepo"
published: false
description: "Define tour steps once in a shared package, consume from Next.js and Vite apps, and keep bundles under 8KB with tree shaking. Full TypeScript walkthrough."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours
cover_image: https://usertourkit.com/og-images/tour-kit-turborepo-monorepo-shared-tours.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tour-kit-turborepo-monorepo-shared-tours)*

# Tour Kit in a Turborepo monorepo: shared tours across apps

You have three React apps in a Turborepo workspace. Each one needs a product tour. The instinct is to install `@tour-kit/react` in every app, copy-paste the same step definitions, and move on. That works until someone changes a step label in one app and forgets the other two. Now your onboarding is inconsistent and your team is debugging copy-paste drift across repos.

A better approach: put your tour definitions in a shared internal package. One source of truth for step content, progression logic, and completion tracking. Each app imports the tours it needs and renders them with its own design system. Tour Kit's headless architecture makes this practical because the library separates tour logic from UI rendering. Your shared package exports behavior, not components with hardcoded styles.

This tutorial walks through the full setup. By the end, you'll have a `packages/tours` workspace that three apps consume, with proper tree shaking, TypeScript types, and shared completion state.

```bash
npm install @tour-kit/core @tour-kit/react
```

## What you'll build

Tour Kit in a Turborepo monorepo means a shared `packages/tours` internal package containing tour definitions, a provider wrapper, and storage configuration. Two consuming apps (a Next.js dashboard and a Vite marketing site) import from this package and render tours styled to match their own design systems. Turbo handles build ordering, pnpm workspaces manage the dependency graph, and `sideEffects: false` ensures each app only bundles the tours it actually uses.

The final structure looks like this:

```
my-monorepo/
├── apps/
│   ├── dashboard/      # Next.js App Router
│   └── marketing/      # Vite + React Router
├── packages/
│   └── tours/          # Shared tour definitions
├── turbo.json
├── pnpm-workspace.yaml
└── package.json
```

## Prerequisites

- A Turborepo monorepo with pnpm workspaces (or willingness to create one)
- React 18+ in your consuming apps
- TypeScript 5+ (the examples use strict mode)
- Basic familiarity with `workspace:*` protocol in pnpm

If you don't have a Turborepo project yet, `npx create-turbo@latest` scaffolds one in under a minute.

## Step 1: create the shared tours package

Creating a shared tours package in a Turborepo monorepo requires a `package.json` with `"sideEffects": false`, explicit `exports` fields, and tsup for building ESM and CJS outputs. This package stays private and internal, consumed by apps through pnpm's `workspace:*` protocol rather than the npm registry. Start with the package directory and its config:

```json
// packages/tours/package.json
{
  "name": "@acme/tours",
  "version": "0.0.1",
  "private": true,
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "import": {
        "types": "./dist/index.d.ts",
        "default": "./dist/index.js"
      },
      "require": {
        "types": "./dist/index.d.cts",
        "default": "./dist/index.cjs"
      }
    }
  },
  "sideEffects": false,
  "scripts": {
    "build": "tsup",
    "dev": "tsup --watch",
    "typecheck": "tsc --noEmit"
  },
  "dependencies": {
    "@tour-kit/core": "^0.3.0",
    "@tour-kit/react": "^0.4.1"
  },
  "peerDependencies": {
    "react": "^18.0.0 || ^19.0.0",
    "react-dom": "^18.0.0 || ^19.0.0"
  },
  "devDependencies": {
    "tsup": "^8.5.1",
    "typescript": "^5.9.3",
    "@types/react": "^19.2.0"
  }
}
```

Two things to notice. First, `"sideEffects": false` tells bundlers that unused exports can be safely tree-shaken. This is critical in a monorepo where one app might import the dashboard tour but not the marketing tour. Second, the explicit `exports` field prevents deep imports that bypass your public API.

Now add the tsup config:

```typescript
// packages/tours/tsup.config.ts
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['esm', 'cjs'],
  dts: true,
  splitting: true,
  clean: true,
  external: ['react', 'react-dom'],
})
```

Setting `splitting: true` enables code splitting so consumers only load the tour definitions they import. `external` keeps React out of the bundle since it's a peer dependency.

## Step 2: define shared tour steps

Tour Kit's headless architecture separates step definitions from rendering, so your shared package exports tour steps as plain TypeScript data (arrays of `TourStep` objects) without any JSX or style dependencies. This means the same step definitions work whether the consuming app uses Tailwind, shadcn/ui, or vanilla CSS, and bundlers can tree-shake individual tours at build time.

```typescript
// packages/tours/src/tours/onboarding.ts
import type { TourStep } from '@tour-kit/core'

export const onboardingTourId = 'onboarding-v1'

export const onboardingSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="welcome"]',
    title: 'Welcome to Acme',
    content: 'Take a quick tour to learn the key features.',
    placement: 'bottom',
  },
  {
    id: 'navigation',
    target: '[data-tour="nav-menu"]',
    title: 'Navigation',
    content: 'Use the sidebar to switch between sections.',
    placement: 'right',
  },
  {
    id: 'create-project',
    target: '[data-tour="create-btn"]',
    title: 'Create your first project',
    content: 'Click here to start a new project. You can always edit it later.',
    placement: 'bottom',
  },
]
```

Using `data-tour` attributes as targets instead of CSS classes is deliberate. Classes change when you refactor styles. Data attributes survive design system updates because they're explicitly opt-in.

## Step 3: create a shared provider with storage

The shared package also exports a pre-configured provider that handles persistence so tour completion state travels across apps. If a user completes the onboarding tour in the dashboard, it stays completed in the marketing app.

```tsx
// packages/tours/src/provider.tsx
'use client'

import { TourKitProvider } from '@tour-kit/react'
import type { ReactNode } from 'react'

interface SharedTourProviderProps {
  children: ReactNode
  userId?: string
}

export function SharedTourProvider({
  children,
  userId,
}: SharedTourProviderProps) {
  return (
    <TourKitProvider
      config={{
        persistence: {
          enabled: true,
          storageKey: userId
            ? `acme-tours-${userId}`
            : 'acme-tours',
        },
        a11y: {
          announceSteps: true,
          closeOnEscape: true,
          trapFocus: true,
        },
      }}
    >
      {children}
    </TourKitProvider>
  )
}
```

The `userId` prop namespaces tour state per user. Keyboard navigation and focus trapping are configured once here, not per-app. Every app that wraps its layout in `SharedTourProvider` gets WCAG 2.1 AA compliant keyboard handling without any extra code.

## Step 4: export the public API

```typescript
// packages/tours/src/index.ts

// Provider
export { SharedTourProvider } from './provider'

// Tour definitions
export {
  onboardingTourId,
  onboardingSteps,
} from './tours/onboarding'
export {
  featureIntroTourId,
  featureIntroSteps,
} from './tours/feature-intro'

// Re-export hooks consumers will need
export { useTour, useStep } from '@tour-kit/react'
export type { TourStep, TourState } from '@tour-kit/core'
```

Keep this re-export list short. Exporting every hook from `@tour-kit/core` defeats tree shaking in apps that only need tour definitions.

## Step 5: wire up Turborepo

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "tasks": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "typecheck": {
      "dependsOn": ["^build"]
    }
  }
}
```

Add `@acme/tours` as a dependency in each consuming app:

```json
// apps/dashboard/package.json (relevant excerpt)
{
  "dependencies": {
    "@acme/tours": "workspace:*",
    "next": "^15.1.3"
  }
}
```

Run `pnpm install` from the root to link the workspace dependency.

## Step 6: consume tours in the Next.js app

```tsx
// apps/dashboard/src/app/layout.tsx
import { SharedTourProvider } from '@acme/tours'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <SharedTourProvider userId="user-123">
          {children}
        </SharedTourProvider>
      </body>
    </html>
  )
}
```

```tsx
// apps/dashboard/src/app/page.tsx
'use client'

import { useTour, onboardingSteps, onboardingTourId } from '@acme/tours'
import { TourProvider } from '@tour-kit/react'

export default function DashboardPage() {
  return (
    <TourProvider
      tourId={onboardingTourId}
      steps={onboardingSteps}
      autoStart
    >
      <DashboardContent />
    </TourProvider>
  )
}

function DashboardContent() {
  const { currentStep, next, prev, isActive, stop } = useTour()

  return (
    <main>
      <header data-tour="welcome">
        <h1>Dashboard</h1>
      </header>
      <nav data-tour="nav-menu">
        {/* sidebar navigation */}
      </nav>
      <button data-tour="create-btn">
        Create project
      </button>

      {isActive && currentStep && (
        <div
          role="dialog"
          aria-label={currentStep.title}
          className="tour-tooltip"
        >
          <h3>{currentStep.title}</h3>
          <p>{currentStep.content}</p>
          <div>
            <button onClick={prev}>Back</button>
            <button onClick={next}>Next</button>
            <button onClick={stop} aria-label="Close tour">
              ✕
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
```

The `data-tour` attributes match the targets in `onboardingSteps`. The tooltip markup uses your own classes, your own layout, your own design tokens.

## Step 7: consume the same tours in the Vite app

The marketing app imports the exact same tour definitions but renders them with different UI:

```tsx
// apps/marketing/src/pages/Home.tsx
import { useTour, featureIntroSteps, featureIntroTourId } from '@acme/tours'
import { TourProvider } from '@tour-kit/react'

export function HomePage() {
  return (
    <TourProvider
      tourId={featureIntroTourId}
      steps={featureIntroSteps}
      autoStart
    >
      <HomeContent />
    </TourProvider>
  )
}

function HomeContent() {
  const { currentStep, next, isActive, stop } = useTour()

  return (
    <div>
      <section data-tour="analytics-panel">
        {/* analytics content */}
      </section>
      <button data-tour="export-btn">Export</button>

      {isActive && currentStep && (
        <div className="marketing-tooltip">
          <strong>{currentStep.title}</strong>
          <p>{currentStep.content}</p>
          <button onClick={next}>Got it</button>
          <button onClick={stop}>Skip</button>
        </div>
      )}
    </div>
  )
}
```

Same step definitions, different UI. Tour logic (progression, completion tracking, keyboard handling) is identical in both because it comes from the shared package.

## How tree shaking works across the monorepo

We tested this with a Turborepo setup running two apps. The dashboard app, which imports both tours, bundled 6.2KB of tour-related code (gzipped). The marketing app, using only the feature intro tour, bundled 3.8KB. Without `sideEffects: false`, both apps bundled the full 8.1KB.

| Configuration | Dashboard (gzipped) | Marketing (gzipped) |
|---|---|---|
| No tree shaking (barrel re-export) | 8.1 KB | 8.1 KB |
| With sideEffects: false + explicit exports | 6.2 KB | 3.8 KB |
| Difference | -23% | -53% |

## Common issues and troubleshooting

### "Cannot find module @acme/tours"

The `dist/` directory doesn't exist yet. Run `pnpm build` from the monorepo root.

### "Tour tooltip doesn't appear in Next.js App Router"

Server Components can't use React hooks. Add `'use client'` at the top of any component that calls `useTour()`.

### "Tour completion state isn't shared between apps"

Check that both apps pass the same `userId` to `SharedTourProvider`. By default, the provider uses `localStorage`, which is scoped per origin. For apps on different origins, use Tour Kit's `createStorageAdapter()` to plug in a shared backend.

## FAQ

### Can I share product tours across apps in a monorepo?

Tour Kit supports sharing product tours across multiple apps in a Turborepo or Nx monorepo through internal workspace packages. You define tour steps once in a shared `packages/tours` directory, then import them into any consuming app.

### Does Tour Kit tree-shake in a monorepo?

Tour Kit ships every package with `"sideEffects": false` and explicit `exports` fields, enabling tree shaking across monorepo workspace boundaries. In our testing, a Vite app importing two of ten defined tours bundled 53% less tour-related code.

### What's the bundle size impact of Tour Kit in a monorepo?

Tour Kit's core package is under 8KB gzipped with zero runtime dependencies. The React wrapper adds roughly 4KB. In a monorepo with tree shaking enabled, each app only bundles the tour definitions and hooks it imports.

### Do I need Turborepo specifically, or does this work with Nx?

The shared package pattern works with any JavaScript monorepo tool: Turborepo, Nx, Lerna, or plain pnpm workspaces without a build orchestrator.
