---
title: "Build a product tour with shadcn/ui components (headless, accessible, ~6KB)"
published: false
description: "shadcn/ui has 75K+ stars and no tour primitive. Here's how to build a fully accessible product tour using Card, Button, and Badge with Tour Kit's headless hooks."
tags: react, typescript, webdev, tutorial
canonical_url: https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial
cover_image: https://usertourkit.com/og-images/shadcn-ui-product-tour-tutorial.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)*

# Building product tours with shadcn/ui components from scratch

shadcn/ui has 75,000+ GitHub stars and no product tour primitive. Radix UI, the headless layer underneath, has [an open discussion from 2022](https://github.com/radix-ui/primitives/discussions/1199) requesting a `@radix-ui/react-tour-point` component. It was never built. A Radix team member explained why: "It seems this pattern altogether would need quite a bit of research to see how it can be made accessible seeing that it needs to 'isolate' portions of the rendered page rather than separate modal content."

Tour Kit is a headless React product tour library (core under 8KB gzipped) built specifically to pair with component libraries like shadcn/ui. It handles the hard parts (step sequencing, element highlighting, focus management, keyboard navigation, screen reader announcements) while you render tour steps with your existing shadcn/ui Card, Button, and Badge components. No style overrides. No `!important` hacks.

By the end of this tutorial, you'll have a 5-step product tour built entirely from shadcn/ui components, with WCAG 2.1 AA accessibility, localStorage persistence, and dark mode support.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A product tour built from shadcn/ui Card, Button, Badge, and Progress components, wired to Tour Kit's headless hooks for step sequencing, spotlight overlays, and WCAG 2.1 AA keyboard navigation. The result looks native to your app because it literally uses your design system components.

## Prerequisites

- React 18.2+ or React 19
- shadcn/ui installed with Tailwind CSS (v3.4+ or v4.x)
- TypeScript 5.0+ (recommended)
- These shadcn/ui components installed: Card, Button, Badge, Progress

## Step 1: install Tour Kit

```bash
npm install @tourkit/core @tourkit/react
# or
pnpm add @tourkit/core @tourkit/react
```

shadcn/ui components are copy-pasted into your project, not installed as npm dependencies. That means zero runtime conflict between Tour Kit and your UI layer.

## Step 2: build the tour tooltip with shadcn/ui Card and Button

The headless approach means your tour tooltip is a regular React component composed from shadcn/ui primitives, not a pre-styled overlay you have to fight with CSS overrides.

```tsx
// src/components/tour-tooltip.tsx
import { useTour } from '@tourkit/react'
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { X } from 'lucide-react'

export function TourTooltip() {
  const { currentStep, next, prev, stop, isFirst, isLast, progress } = useTour()

  if (!currentStep) return null

  const percentage = (progress.current / progress.total) * 100

  return (
    <Card
      className="w-80 shadow-lg"
      role="dialog"
      aria-label={currentStep.title}
    >
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Badge variant="secondary">
          {progress.current} of {progress.total}
        </Badge>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={stop}
          aria-label="Close tour"
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pb-3">
        <h3 className="mb-1 text-sm font-semibold">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground">{currentStep.content}</p>
      </CardContent>
      <Progress value={percentage} className="mx-4 mb-3 h-1" />
      <CardFooter className="flex justify-between pt-0">
        {!isFirst ? (
          <Button variant="outline" size="sm" onClick={prev}>
            Back
          </Button>
        ) : (
          <span />
        )}
        <Button size="sm" onClick={isLast ? stop : next}>
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

Every element is a shadcn/ui primitive. The Card respects your CSS variables for `--radius`, `--border`, and `--card`. Dark mode works automatically through CSS variable theming.

## Step 3: define tour steps

```tsx
// src/tours/dashboard-tour.ts
import type { TourStep } from '@tourkit/core'

export const dashboardSteps: TourStep[] = [
  {
    id: 'sidebar-nav',
    target: '[data-tour="sidebar"]',
    title: 'Navigation',
    content: 'Browse projects, team settings, and billing from the sidebar.',
  },
  {
    id: 'command-palette',
    target: '[data-tour="search"]',
    title: 'Command palette',
    content: 'Press Cmd+K to search across projects, docs, and team members.',
  },
  {
    id: 'new-project',
    target: '[data-tour="create-btn"]',
    title: 'Create a project',
    content: 'Start from a template or import an existing repository.',
  },
  {
    id: 'notifications',
    target: '[data-tour="notifications"]',
    title: 'Activity feed',
    content: 'Deployment alerts, review requests, and mentions appear here.',
  },
  {
    id: 'user-menu',
    target: '[data-tour="profile"]',
    title: 'Your account',
    content: 'API keys, connected integrations, and appearance settings.',
  },
]
```

The `data-tour` attribute approach keeps selectors stable across refactors. Class names change. IDs get renamed. Data attributes are explicit contracts.

## Step 4: wire up the provider and tour component

```tsx
// src/app/layout.tsx (Next.js) or src/App.tsx (Vite)
import { TourProvider } from '@tourkit/react'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <TourProvider>
          {children}
        </TourProvider>
      </body>
    </html>
  )
}
```

```tsx
// src/components/dashboard.tsx
import { Tour, useTourControls } from '@tourkit/react'
import { TourTooltip } from './tour-tooltip'
import { dashboardSteps } from '@/tours/dashboard-tour'
import { Button } from '@/components/ui/button'
import { HelpCircle } from 'lucide-react'

function TourTrigger() {
  const { start } = useTourControls('dashboard-tour')

  return (
    <Button variant="outline" size="sm" onClick={() => start()}>
      <HelpCircle className="mr-2 h-4 w-4" />
      Take a tour
    </Button>
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

      <nav data-tour="sidebar">{/* sidebar content */}</nav>
      <div data-tour="search">{/* command palette trigger */}</div>
      <button data-tour="create-btn">{/* new project button */}</button>
      <div data-tour="notifications">{/* notification bell */}</div>
      <div data-tour="profile">{/* user avatar menu */}</div>
    </>
  )
}
```

## Step 5: keyboard navigation and screen reader support

Keyboard navigation is built into Tour Kit's core. Escape closes the tour, Tab and Arrow keys navigate between steps, Enter activates the current action.

For screen readers, Tour Kit manages a live region that announces step changes ("Step 2 of 5: Command palette"). Your tooltip's `role="dialog"` and `aria-label` attributes complete the accessibility picture.

[Smashing Magazine's guide to React product tours](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/), the top-ranking result for "product tour React app", doesn't mention accessibility once. Tour Kit fills that gap with WCAG 2.1 AA compliance built into the core.

## Why not just use Radix Popover?

Three problems with the Popover approach:

1. Popover doesn't manage multi-step sequences
2. Focus management across steps (closing one popover, opening another) drops focus to the body element
3. The overlay isolation pattern (dimming everything except the highlighted element) requires z-index coordination Popover doesn't handle

| Approach | Bundle cost | Step management | WCAG 2.1 AA | Time to implement |
|---|---|---|---|---|
| Tour Kit + shadcn/ui | ~6KB gzipped | Built-in state machine | Yes | ~15 minutes |
| Raw Radix Popover + custom state | ~3KB gzipped | Build your own | Partial | 2-4 hours |
| React Joyride | ~37KB gzipped | Built-in callbacks | Partial | ~30 minutes |
| shadcn-tour (community) | ~4KB gzipped | Hook-based | Basic | ~20 minutes |

## Limitation

Tour Kit has no visual builder. You define steps in TypeScript, which means a developer needs to be involved. If your product team needs a no-code editor, Tour Kit isn't the right fit today.

Full article with all code examples, troubleshooting, and FAQ: [usertourkit.com/blog/shadcn-ui-product-tour-tutorial](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)
