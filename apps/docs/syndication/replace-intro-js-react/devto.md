---
title: "Replacing Intro.js with a headless React tour library (step-by-step)"
published: false
description: "Intro.js's React wrapper hasn't been updated in 3+ years. Here's how to migrate to a headless alternative that runs inside React's component tree, ships under 8KB, and uses MIT licensing."
tags: react, javascript, tutorial, webdev
canonical_url: https://usertourkit.com/blog/replace-intro-js-react
cover_image: https://usertourkit.com/og-images/replace-intro-js-react.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/replace-intro-js-react)*

# How to replace Intro.js with a modern React tour library

Intro.js has 23,800 GitHub stars and 215K weekly npm downloads as of April 2026. It earned that popularity. But its React wrapper hasn't been updated in over three years, its AGPL license forces source disclosure for commercial apps, and its DOM-centric architecture fights React at every turn. If you've been patching around positioning bugs, writing `!important` overrides for Tailwind, or manually bridging Intro.js callbacks to React state, this guide is the exit ramp.

We'll replace an Intro.js tour with Tour Kit, a headless React library that ships under 8KB gzipped (core) and uses MIT licensing.

```bash
npm install @tourkit/core @tourkit/react
```

## Why replace Intro.js in a React project?

Intro.js was built as a framework-agnostic vanilla JavaScript library. It manipulates the DOM directly to create tooltips, overlays, and highlights. In a React 19 codebase with server components, Tailwind, and a Radix-based design system, it creates friction at five specific points.

**The React wrapper is abandoned.** The `intro.js-react` package sits at v1.0.0, last published over three years ago. It predates React 19, React Server Components, and the `use` hook.

**AGPL licensing requires source disclosure.** Intro.js uses AGPL-3.0. If you ship a commercial product without purchasing a commercial license ($9.99 to $299.99), the AGPL requires you to disclose your source code.

**DOM manipulation causes race conditions.** Intro.js calls `document.querySelector` and mutates elements outside React's tree. When React re-renders, Intro.js references go stale. [GitHub issue #1162](https://github.com/usablica/intro.js/issues/1162) documents a case where calling `introJs()` too quickly after `exitIntro()` throws exceptions.

**Positioning breaks with CSS transforms.** If your layout uses `transform: translate3d`, Intro.js positions tooltips in the wrong place. [GitHub issue #833](https://github.com/usablica/intro.js/issues/833) has been open since 2020.

**Accessibility is incomplete.** Intro.js popovers lack `aria-labelledby` and `aria-describedby`. Navigation buttons are `<a>` tags with `role="button"` instead of actual `<button>` elements. There is no focus trap.

## Step 1: remove Intro.js and install Tour Kit

```bash
npm uninstall intro.js intro.js-react
npm install @tourkit/core @tourkit/react
```

Delete the `introjs.css` import wherever it appears. Tour Kit is headless — no library CSS to import.

## Step 2: convert step definitions

### Intro.js (before)

```ts
const introSteps = [
  {
    element: '#sidebar',
    intro: 'Use the sidebar to navigate between sections.',
    position: 'right',
  },
  {
    element: '#search-input',
    intro: 'Search across your entire workspace.',
    position: 'bottom',
  },
]
```

### Tour Kit (after)

```ts
import type { TourStep } from '@tourkit/core'

export const dashboardSteps: TourStep[] = [
  {
    id: 'sidebar',
    target: '#sidebar',
    title: 'Navigation',
    content: 'Use the sidebar to navigate between sections.',
    placement: 'right',
  },
  {
    id: 'search',
    target: '#search-input',
    title: 'Search',
    content: 'Search across your entire workspace.',
    placement: 'bottom',
  },
]
```

Three differences: each step gets a unique `id` (used for persistence and analytics), the `intro` field splits into `title` and `content`, and `position` becomes `placement`.

## Step 3: replace the imperative tour with a React component

### Intro.js (before)

```tsx
import introJs from 'intro.js'
import 'intro.js/introjs.css'
import { useEffect } from 'react'

export function DashboardTour() {
  useEffect(() => {
    const intro = introJs()
    intro.setOptions({ steps: introSteps, showProgress: true })
    intro.oncomplete(() => localStorage.setItem('tour-done', 'true'))
    intro.onexit(() => localStorage.setItem('tour-done', 'true'))
    const done = localStorage.getItem('tour-done')
    if (!done) intro.start()
    return () => intro.exit(true)
  }, [])
  return null
}
```

### Tour Kit (after)

```tsx
import { Tour, TourStep, TourTooltip } from '@tourkit/react'
import { dashboardSteps } from '../tour/steps'

export function DashboardTour() {
  return (
    <Tour tourId="dashboard-intro" steps={dashboardSteps} persist="localStorage">
      {dashboardSteps.map((step) => (
        <TourStep key={step.id} id={step.id}>
          <TourTooltip>
            {({ step: current, next, prev, stop, progress }) => (
              <div className="rounded-lg border bg-white p-4 shadow-lg">
                <h3 className="font-semibold">{current.title}</h3>
                <p className="mt-1 text-sm text-gray-600">{current.content}</p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-xs text-gray-400">
                    {progress.current + 1} of {progress.total}
                  </span>
                  <div className="flex gap-2">
                    {progress.current > 0 && (
                      <button onClick={prev} className="rounded px-3 py-1 text-sm">Back</button>
                    )}
                    <button onClick={progress.current < progress.total - 1 ? next : stop}
                      className="rounded bg-blue-600 px-3 py-1 text-sm text-white">
                      {progress.current < progress.total - 1 ? 'Next' : 'Done'}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </TourTooltip>
        </TourStep>
      ))}
    </Tour>
  )
}
```

The `persist="localStorage"` prop handles what Intro.js needed manual `localStorage` calls for. The tooltip is a regular React component with Tailwind classes.

## Step 4: wire up the provider

```tsx
import { TourProvider } from '@tourkit/react'
import { DashboardTour } from './components/DashboardTour'

export default function App() {
  return (
    <TourProvider>
      <Dashboard />
      <DashboardTour />
    </TourProvider>
  )
}
```

## Step 5: migrate callbacks

Intro.js uses method chaining. Tour Kit uses props:

```tsx
<Tour
  tourId="dashboard-intro"
  steps={dashboardSteps}
  onComplete={() => console.log('Tour finished')}
  onSkip={() => console.log('Tour skipped')}
  onStepChange={(stepId) => console.log('Step changed to', stepId)}
  onBeforeStepChange={async (stepId) => {
    return await someAsyncCheck(stepId)
  }}
/>
```

## Comparison table

| Feature | Intro.js | Tour Kit |
|---------|----------|----------|
| Bundle size (gzipped) | 16.5 KB | <8 KB (core) |
| License | AGPL-3.0 (commercial from $9.99) | MIT (free forever) |
| React integration | Wrapper, last updated 3+ years ago | Native React components |
| React 19 support | Unconfirmed | Tested and supported |
| TypeScript | DefinitelyTyped | First-class, ships own types |
| Focus trap | None | Built-in, WCAG 2.1 AA |
| ARIA attributes | Incomplete | Full |
| Persistence | Manual localStorage | Built-in |
| Styling | introjs.css + overrides | Headless (you provide UI) |

## Disclosure

We built Tour Kit, so take this comparison with appropriate skepticism. Every claim is verifiable against [npm](https://www.npmjs.com/package/intro.js), [bundlephobia](https://bundlephobia.com/package/intro.js), and the [Intro.js GitHub issues](https://github.com/usablica/intro.js/issues). Tour Kit doesn't have a visual builder and requires React 18+.

Full article with troubleshooting section and FAQ: [usertourkit.com/blog/replace-intro-js-react](https://usertourkit.com/blog/replace-intro-js-react)
