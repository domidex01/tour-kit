---
title: "Adding product tours to Vite + React + Tailwind (with full a11y)"
published: false
description: "Most React tour libraries fight your Tailwind classes. Here's how to build a fully accessible product tour using a headless library that lets you style tooltips with utility classes."
tags: react, javascript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/vite-react-tailwind-product-tour
cover_image: https://usertourkit.com/og-images/vite-react-tailwind-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/vite-react-tailwind-product-tour)*

# How to add product tours to a Vite + React + Tailwind stack

Vite, React, and Tailwind CSS is the most common frontend stack in 2026. Create React App is no longer maintained, Tailwind v4.1 ships a dedicated `@tailwindcss/vite` plugin, and shadcn/ui has made utility-first styling the default for new React projects. But when you try to drop a product tour into this stack, you hit a wall: React Joyride injects its own inline styles that fight your Tailwind classes, React Tour requires a styled-components dependency you don't want, and most tutorials skip accessibility entirely. CSS-Tricks' own onboarding UI experiment [admits it's "far from perfect as an accessible user experience"](https://css-tricks.com/one-of-those-onboarding-uis-with-anchor-positioning/).

Tour Kit is a headless React product tour library (core under 8KB gzipped) that gives you step sequencing, element highlighting, scroll management, and keyboard navigation without prescribing any UI. Style tooltips with Tailwind. Compose with shadcn/ui. Keep full control over markup. By the end of this tutorial, you'll have a working 5-step product tour in a Vite + React + Tailwind project, styled entirely with your existing utility classes.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

Tour Kit provides the tour logic as React hooks and components. You provide the tooltip markup with Tailwind classes. The result is a product tour that looks native to your design system because it literally is your design system. No CSS overrides, no `!important` hacks, no "how do I change the tooltip color" GitHub issues.

We tested this integration in a Vite 6 + React 19 + Tailwind v4.1 + TypeScript 5.7 project. The whole setup takes about 10 minutes if you already have a Vite app with some UI elements worth touring.

## Prerequisites

- Vite 5+ (Vite 6 recommended)
- React 18.2+ or React 19
- Tailwind CSS v3.4+ or v4.x
- TypeScript 5.0+ (recommended, not required)
- A few UI elements to tour (dashboard, sidebar, settings panel)

## Step 1: install Tour Kit

Tour Kit ships two packages. `@tourkit/core` holds the framework-agnostic engine: step state machine, position calculations, localStorage persistence, and ARIA attribute management. `@tourkit/react` adds React hooks and components. Install both.

```bash
npm install @tourkit/core @tourkit/react
```

With pnpm (common in Vite projects):

```bash
pnpm add @tourkit/core @tourkit/react
```

Both packages are ESM-first, which means Vite resolves them without any config changes. No manual dependency pre-bundling entries, no `ssr.noExternal` workaround. Vite handles everything automatically.

Tree-shaking works out of the box. If you only import `useTour` and `TourProvider`, Vite's Rollup-based build strips everything else. We measured the production bundle impact at under 6KB gzipped for a typical 5-step tour setup.

## Step 2: wrap your app with the tour provider

Tour Kit uses a React context provider to share tour state across your component tree, so child components can read the current step, trigger navigation, and respond to tour events without prop drilling. Place `TourProvider` near the root of your Vite app, inside `main.tsx` or `App.tsx`.

```tsx
// src/App.tsx
import { TourProvider } from '@tourkit/react'
import { Dashboard } from './components/Dashboard'

export function App() {
  return (
    <TourProvider>
      <Dashboard />
    </TourProvider>
  )
}
```

`TourProvider` accepts an optional `persist` prop for saving tour completion state to localStorage. We'll add that in Step 4.

## Step 3: define tour steps and build the tooltip

This is where Tour Kit's headless approach shines with Tailwind. Instead of fighting a library's built-in tooltip styles, you write a regular React component with your own utility classes.

First, define the steps. Each step targets a DOM element by CSS selector and carries the content you want to display.

```tsx
// src/tours/dashboard-tour.ts
import type { TourStep } from '@tourkit/core'

export const dashboardSteps: TourStep[] = [
  {
    id: 'welcome',
    target: '[data-tour="sidebar"]',
    title: 'Navigation sidebar',
    content: 'Browse your projects, settings, and team members here.',
  },
  {
    id: 'search',
    target: '[data-tour="search"]',
    title: 'Quick search',
    content: 'Press Cmd+K to search across all your projects.',
  },
  {
    id: 'create',
    target: '[data-tour="create-btn"]',
    title: 'Create a project',
    content: 'Start a new project from a template or blank canvas.',
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Notifications',
    content: 'Team activity, mentions, and deployment alerts show up here.',
  },
  {
    id: 'profile',
    target: '[data-tour="profile"]',
    title: 'Your profile',
    content: 'Manage your account settings, API keys, and billing.',
  },
]
```

Now build the tooltip component. This is just a Tailwind-styled div. Tour Kit passes the current step data, navigation callbacks, and positioning through the render prop.

```tsx
// src/components/TourTooltip.tsx
import { useTour } from '@tourkit/react'

export function TourTooltip() {
  const { currentStep, next, prev, stop, isFirst, isLast, progress } = useTour()

  if (!currentStep) return null

  return (
    <div
      className="w-72 rounded-lg border border-zinc-200 bg-white p-4 shadow-lg
                 dark:border-zinc-700 dark:bg-zinc-900"
      role="dialog"
      aria-label={currentStep.title}
    >
      <div className="mb-1 flex items-center justify-between">
        <span className="text-xs text-zinc-500 dark:text-zinc-400">
          {progress.current} of {progress.total}
        </span>
        <button
          onClick={stop}
          className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300"
          aria-label="Close tour"
        >
          ×
        </button>
      </div>
      <h3 className="mb-1 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
        {currentStep.title}
      </h3>
      <p className="mb-3 text-sm text-zinc-600 dark:text-zinc-400">
        {currentStep.content}
      </p>
      <div className="flex justify-between">
        {!isFirst ? (
          <button
            onClick={prev}
            className="rounded px-3 py-1.5 text-sm text-zinc-600
                       hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            Back
          </button>
        ) : (
          <span />
        )}
        <button
          onClick={isLast ? stop : next}
          className="rounded bg-zinc-900 px-3 py-1.5 text-sm text-white
                     hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900
                     dark:hover:bg-zinc-200"
        >
          {isLast ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  )
}
```

Every class is yours. Rounded-full buttons? Change the class. Brand color instead of zinc? Swap it. No `!important` overrides, no CSS specificity battles.

## Step 4: wire up the tour with persistence

Now connect the steps, tooltip, and a trigger button. Tour Kit's `Tour` component handles element highlighting (the spotlight overlay), scroll-to-target, and tooltip positioning.

```tsx
// src/components/Dashboard.tsx
import { Tour, useTourControls } from '@tourkit/react'
import { TourTooltip } from './TourTooltip'
import { dashboardSteps } from '../tours/dashboard-tour'

function TourTrigger() {
  const { start } = useTourControls('dashboard-tour')

  return (
    <button
      onClick={() => start()}
      className="rounded bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
    >
      Take a tour
    </button>
  )
}

export function Dashboard() {
  return (
    <>
      <Tour
        tourId="dashboard-tour"
        steps={dashboardSteps}
        persist={{ key: 'dashboard-tour-v1', storage: 'localStorage' }}
      >
        <TourTooltip />
      </Tour>

      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <TourTrigger />
      </header>

      {/* Your dashboard UI with data-tour attributes */}
      <nav data-tour="sidebar">{/* ... */}</nav>
      <div data-tour="search">{/* ... */}</div>
      <button data-tour="create-btn">{/* ... */}</button>
      <div data-tour="notifications">{/* ... */}</div>
      <div data-tour="profile">{/* ... */}</div>
    </>
  )
}
```

The `persist` prop saves completion state to localStorage under the key `dashboard-tour-v1`. Returning users won't see the tour again. Bump the key to `v2` when you change the steps and want everyone to see the tour again.

## Step 5: add keyboard navigation and screen reader support

Tour Kit handles keyboard navigation out of the box: Escape closes the tour, Arrow keys and Tab move between steps, Enter advances. No configuration needed when using the `Tour` component.

Your custom tooltip still needs the right ARIA attributes. The tooltip we built in Step 3 already includes `role="dialog"` and `aria-label`. Tour Kit manages focus automatically, moving it to the tooltip when a step activates and returning it to the trigger element when the tour ends.

For screen readers, Tour Kit announces step changes through a live region. Nothing to configure there.

Test it anyway. Fire up VoiceOver (macOS) or NVDA (Windows) and tab through the tour. Each step's title and content should be announced, plus "step 2 of 5" progress updates.

This matters more than most teams realize. [Smashing Magazine's comprehensive guide to React product tours](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/) doesn't mention accessibility once. The WCAG 2.1 AA standard requires that interactive content be operable by keyboard and perceivable by assistive technology. Product tours are interactive overlays that trap focus, which means they fall squarely under [WCAG success criterion 2.1.1 (Keyboard)](https://www.w3.org/WAI/WCAG21/Understanding/keyboard.html) and [2.4.3 (Focus Order)](https://www.w3.org/WAI/WCAG21/Understanding/focus-order.html).

## Vite-specific considerations

Tour Kit's ESM-first package output aligns with how Vite resolves and pre-bundles dependencies, which means zero configuration overhead for dev or production builds. Here are the Vite-specific behaviors worth knowing when you ship a tour to production.

**Dev server:** Vite pre-bundles dependencies on first run. Tour Kit gets pre-bundled once and cached. Hot module replacement works: edit your tooltip component, and Vite swaps the module in under 80ms without losing tour state.

**Production build:** Vite uses Rollup (or Rolldown in Vite 8) for production bundles. Tour Kit's package exports are configured for tree-shaking. As of April 2026, Vite 8's experimental Full Bundle Mode produces bundles that are roughly 3x faster to build and 10x fewer network requests in dev ([Vite 8 announcement](https://vite.dev/blog/announcing-vite8)).

**Bundle impact:** We measured Tour Kit's production contribution in a Vite 6 build using `npx vite-bundle-visualizer`. The `@tourkit/core` + `@tourkit/react` imports for a 5-step tour added 5.8KB gzipped to the output. For context, Vite projects average about 130KB total bundle size, so Tour Kit adds roughly 4.5% overhead.

| Library | Gzipped size | Tailwind compatible | WCAG 2.1 AA | Tree-shakeable |
|---------|-------------|-------------------|-------------|---------------|
| Tour Kit (core + react) | ~6KB | Yes (headless) | Yes | Yes |
| React Joyride | ~37KB | Partial (inline styles) | Partial | No |
| React Tour / Reactour | ~12KB + styled-components | No (CSS-in-JS) | No | No |
| Driver.js | ~5KB | Partial (own CSS) | Partial | Yes |

## Common issues and troubleshooting

Every product tour library has edge cases around DOM timing, CSS stacking contexts, and dark mode inheritance. These are the three issues we hit most often when testing Tour Kit in Vite + Tailwind projects, with the exact fixes.

### Tour tooltip doesn't appear

The most common cause: the target element hasn't rendered when the tour starts. If you're lazy-loading a component that contains the `data-tour` attribute, the selector won't match until after the component mounts.

Tour Kit waits for target elements by default (up to 3 seconds). If your component loads slower than that, increase the timeout:

```tsx
<Tour
  tourId="dashboard-tour"
  steps={dashboardSteps}
  waitForElement={{ timeout: 5000 }}
>
  <TourTooltip />
</Tour>
```

### Spotlight overlay doesn't cover the full viewport

This happens when a parent element has `overflow: hidden` or `transform` set, which creates a new stacking context. Tour Kit's overlay uses `position: fixed`, so any ancestor with `transform` breaks the positioning.

Fix: move the `Tour` component higher in the tree, outside the transformed parent. Placing it directly inside `App.tsx` (but inside `TourProvider`) usually resolves this.

### Tailwind dark mode classes don't apply to the tooltip

If your project uses Tailwind's `class` dark mode strategy (the default in v4.x), the tooltip component picks up dark mode automatically because it renders inside your app's DOM tree. But if you're using the `media` strategy, the tooltip also works because it responds to `prefers-color-scheme`.

The key point: Tour Kit doesn't render into a separate portal by default, so your Tailwind context stays intact.

## Next steps

You now have a working product tour styled with Tailwind in a Vite project. Here's what to build next.

- **Conditional tours by user role** - Show different tours for admins vs regular users. See the [conditional product tour guide](https://usertourkit.com/blog/conditional-product-tour-user-role).
- **Progress persistence across sessions** - The `persist` prop handles basic localStorage, but Tour Kit also supports custom storage adapters for server-side persistence. See [tour progress persistence](https://usertourkit.com/blog/tour-progress-persistence-localstorage).
- **Animated transitions** - Add Framer Motion enter/exit animations to your tooltip. We cover this in [product tour animations with Framer Motion](https://usertourkit.com/blog/product-tour-framer-motion-animations).
- **Hints and hotspots** - Pair `@tourkit/hints` with your tour for always-visible feature discovery. See the [React hotspot guide](https://usertourkit.com/blog/react-hotspot-component).

One honest limitation: Tour Kit doesn't have a visual builder. You define steps in code, which means a developer needs to be involved. If your product team needs a no-code tour editor, Tour Kit isn't the right fit today. But if your team already writes React and Tailwind, defining steps in TypeScript is faster than dragging boxes in a GUI.

## FAQ

### Does Tour Kit work with Vite's dev server without extra configuration?

Tour Kit ships ESM-first with proper `exports` fields in `package.json`, which is exactly what Vite expects. No manual dep pre-bundling entries, no `resolve.alias` hacks, no Vite plugin required. Install and import. Vite pre-bundles Tour Kit on first dev server start and caches the result.

### How is Tour Kit different from React Joyride for Tailwind projects?

React Joyride ships its own tooltip with inline styles. Matching those to Tailwind tokens requires custom component replacements and specificity battles. Tour Kit is headless: it provides tour logic and you write the tooltip JSX with Tailwind classes. No `!important` overrides. Joyride (5,100+ stars) is battle-tested, but its opinionated styling conflicts with utility-first CSS.

### Does adding a product tour affect Vite build performance?

Tour Kit adds roughly 5.8KB gzipped to a production Vite build for a typical 5-step tour. The library tree-shakes unused exports, so you pay only for what you import. Vite projects average about 130KB total, making Tour Kit's contribution about 4.5%. Build time impact is negligible because Vite processes Tour Kit's pre-compiled ESM output in milliseconds.

### Is Tour Kit accessible by default?

Tour Kit ships with WCAG 2.1 AA compliance built into the core. Keyboard navigation (Escape, Tab, Enter, Arrow keys), focus trapping during active steps, focus restoration when the tour ends, and live region announcements for screen readers all work without extra configuration. You still need to add `role="dialog"` and `aria-label` to your custom tooltip component, as shown in the code examples above.

### Can I use Tour Kit with shadcn/ui components inside the tooltip?

Yes. Tour Kit's tooltip is your React component, so you can compose it from any library. Use a shadcn/ui `Card` for the container, a `Button` for navigation, and a `Badge` for the step counter. Tour Kit doesn't care what you render. It handles positioning and highlighting; you handle markup.
