---
title: "Building product tours with shadcn/ui components from scratch"
slug: "shadcn-ui-product-tour-tutorial"
canonical: https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial
tags: react, javascript, web-development, typescript, accessibility
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)*

# Building product tours with shadcn/ui components from scratch

shadcn/ui has 75,000+ GitHub stars and no product tour primitive. Radix UI, the headless layer underneath, has [an open discussion from 2022](https://github.com/radix-ui/primitives/discussions/1199) requesting a `@radix-ui/react-tour-point` component. It was never built. A Radix team member explained why: "It seems this pattern altogether would need quite a bit of research to see how it can be made accessible seeing that it needs to 'isolate' portions of the rendered page rather than separate modal content."

Tour Kit is a headless React product tour library (core under 8KB gzipped) built specifically to pair with component libraries like shadcn/ui. It handles step sequencing, element highlighting, focus management, keyboard navigation, and screen reader announcements while you render tour steps with your existing shadcn/ui Card, Button, and Badge components.

By the end of this tutorial, you'll have a 5-step product tour built entirely from shadcn/ui components, with WCAG 2.1 AA accessibility, localStorage persistence, and dark mode support.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

A product tour built from shadcn/ui Card, Button, Badge, and Progress components, wired to Tour Kit's headless hooks for step sequencing, spotlight overlays, and WCAG 2.1 AA keyboard navigation.

## Prerequisites

- React 18.2+ or React 19
- shadcn/ui installed with Tailwind CSS (v3.4+ or v4.x)
- TypeScript 5.0+ (recommended)
- shadcn/ui Card, Button, Badge, Progress components installed

## Step 1: install Tour Kit

```bash
npm install @tourkit/core @tourkit/react
```

## Step 2: build the tour tooltip

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
    <Card className="w-80 shadow-lg" role="dialog" aria-label={currentStep.title}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <Badge variant="secondary">
          {progress.current} of {progress.total}
        </Badge>
        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={stop} aria-label="Close tour">
          <X className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>
      <CardContent className="pb-3">
        <h3 className="mb-1 text-sm font-semibold">{currentStep.title}</h3>
        <p className="text-sm text-muted-foreground">{currentStep.content}</p>
      </CardContent>
      <Progress value={percentage} className="mx-4 mb-3 h-1" />
      <CardFooter className="flex justify-between pt-0">
        {!isFirst ? <Button variant="outline" size="sm" onClick={prev}>Back</Button> : <span />}
        <Button size="sm" onClick={isLast ? stop : next}>
          {isLast ? 'Finish' : 'Next'}
        </Button>
      </CardFooter>
    </Card>
  )
}
```

## Step 3: define tour steps

```tsx
// src/tours/dashboard-tour.ts
import type { TourStep } from '@tourkit/core'

export const dashboardSteps: TourStep[] = [
  { id: 'sidebar-nav', target: '[data-tour="sidebar"]', title: 'Navigation', content: 'Browse projects, team settings, and billing from the sidebar.' },
  { id: 'command-palette', target: '[data-tour="search"]', title: 'Command palette', content: 'Press Cmd+K to search across projects, docs, and team members.' },
  { id: 'new-project', target: '[data-tour="create-btn"]', title: 'Create a project', content: 'Start from a template or import an existing repository.' },
  { id: 'notifications', target: '[data-tour="notifications"]', title: 'Activity feed', content: 'Deployment alerts, review requests, and mentions appear here.' },
  { id: 'user-menu', target: '[data-tour="profile"]', title: 'Your account', content: 'API keys, connected integrations, and appearance settings.' },
]
```

## Step 4: wire up provider and tour

```tsx
// src/components/dashboard.tsx
import { Tour, useTourControls } from '@tourkit/react'
import { TourTooltip } from './tour-tooltip'
import { dashboardSteps } from '@/tours/dashboard-tour'
import { Button } from '@/components/ui/button'

function TourTrigger() {
  const { start } = useTourControls('dashboard-tour')
  return <Button variant="outline" size="sm" onClick={() => start()}>Take a tour</Button>
}

export function Dashboard() {
  return (
    <>
      <Tour tourId="dashboard-tour" steps={dashboardSteps} persist={{ key: 'dashboard-tour-v1', storage: 'localStorage' }}>
        <TourTooltip />
      </Tour>
      <header className="flex items-center justify-between border-b px-6 py-4">
        <h1 className="text-lg font-semibold">Dashboard</h1>
        <TourTrigger />
      </header>
      <nav data-tour="sidebar">{/* ... */}</nav>
      <div data-tour="search">{/* ... */}</div>
      <button data-tour="create-btn">{/* ... */}</button>
      <div data-tour="notifications">{/* ... */}</div>
      <div data-tour="profile">{/* ... */}</div>
    </>
  )
}
```

## Step 5: accessibility is built in

Keyboard navigation works out of the box: Escape closes the tour, Tab and Arrow keys navigate steps, Enter activates the current action. Focus moves to the tooltip when a step starts and returns to the trigger when the tour ends.

Tour Kit ships with WCAG 2.1 AA compliance in the core. [Smashing Magazine's React product tour guide](https://www.smashingmagazine.com/2020/08/guide-product-tours-react-apps/) doesn't mention accessibility once. Tour Kit fills that gap.

## Full article

For tooltip customization variants, the Radix Popover comparison, troubleshooting, and FAQ, see the complete tutorial: [usertourkit.com/blog/shadcn-ui-product-tour-tutorial](https://usertourkit.com/blog/shadcn-ui-product-tour-tutorial)
