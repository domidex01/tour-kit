---
title: "Migrating from Driver.js to Tour Kit: Adding Headless Power"
slug: "migrate-driver-js-tour-kit"
canonical: https://usertourkit.com/blog/migrate-driver-js-tour-kit
tags: react, javascript, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/migrate-driver-js-tour-kit)*

# Migrating from Driver.js to Tour Kit: adding headless power

Driver.js is a lightweight, dependency-free library for creating product tours and element highlights. It ships at roughly 5KB gzipped and works in any JavaScript framework. If your project has outgrown its popover-only UI, imperative API, or lack of React integration, this guide walks you through replacing Driver.js with userTourKit step by step.

```bash
npm install @tourkit/core @tourkit/react
```

## Why migrate?

Driver.js solves the simple case well. You call `driver()`, pass some steps, and call `drive()`. The problems show up when your project needs any of these:

- **Custom UI beyond popovers.** Driver.js renders a single popover template. You cannot swap it for a shadcn/ui card, a Radix dialog, or a custom React component without hacking the DOM after render via `onPopoverRender`.
- **React state integration.** Driver.js operates imperatively outside React's component tree.
- **Multi-page tours.** No built-in support for tours that span multiple routes.
- **Accessibility.** Missing `aria-expanded`, duplicate heading landmarks, no focus trapping.
- **Analytics.** No built-in way to track drop-off, skip rates, or completion.

userTourKit addresses all five. It is headless — you provide the UI components, it handles step sequencing, positioning, scroll management, keyboard navigation, and persistence. Core is under 8KB gzipped.

## The migration in 7 steps

### Step 1: Replace step definitions

**Driver.js:**
```js
const driverObj = driver({
  steps: [{
    element: '#sidebar',
    popover: { title: 'Navigation', description: 'Switch sections.', side: 'right', align: 'start' }
  }]
})
driverObj.drive()
```

**Tour Kit:**
```tsx
const steps: TourStep[] = [{
  id: 'sidebar',
  target: '[data-tour="sidebar"]',
  title: 'Navigation',
  content: 'Switch sections.',
  placement: 'right-start',
}]

<TourProvider tourId="onboarding" steps={steps}>
  {/* app */}
</TourProvider>
```

Key changes: flat properties (no `popover` nesting), `id` required, data attributes over CSS selectors, combined `placement` string.

### Step 2: Replace tour lifecycle

```tsx
const { start, next, prev, goTo, stop, complete, isActive, currentStepIndex } = useTour('onboarding')
```

All properties are reactive — your component re-renders when they change.

### Step 3: Build your own tooltip

The biggest win. Instead of `popoverClass` overrides and `onPopoverRender` DOM hacks, you write a React component:

```tsx
function TourTooltip() {
  const { currentStep, next, prev, stop, isFirstStep, isLastStep } = useTour('onboarding')
  if (!currentStep) return null

  return (
    <Card className="w-80 shadow-lg">
      <CardHeader>
        <h3>{currentStep.title}</h3>
        <Button variant="ghost" onClick={stop} aria-label="Close">×</Button>
      </CardHeader>
      <CardContent>{currentStep.content}</CardContent>
      <CardFooter>
        {!isFirstStep && <Button variant="outline" onClick={prev}>Back</Button>}
        <Button onClick={isLastStep ? stop : next}>{isLastStep ? 'Done' : 'Next'}</Button>
      </CardFooter>
    </Card>
  )
}
```

### Step 4: Configure spotlight

```tsx
<TourProvider
  tourId="onboarding"
  steps={steps}
  spotlight={{ color: 'rgba(0,0,0,0.7)', padding: 10, borderRadius: 8, animate: true }}
/>
```

### Step 5: Migrate callbacks

Driver.js gives you callbacks because it owns the UI. Tour Kit gives you hooks because you own the UI. `onNextClick` becomes your button's `onClick`. `onDeselected` becomes step-level `onHide`.

### Step 6: Add multi-page support

```tsx
{ id: 'settings', target: '[data-tour="settings"]', route: '/settings', routeMatch: 'exact' }
```

### Step 7: Unlock new capabilities

Conditional steps with `when`, branching tours with `onAction`, built-in persistence with `persist="localStorage"`, and keyboard navigation out of the box.

## Full API mapping reference

The complete Driver.js-to-Tour-Kit API mapping table (every method, config option, and callback) is in the [full article](https://usertourkit.com/blog/migrate-driver-js-tour-kit).

---

Full article with migration checklist: [usertourkit.com/blog/migrate-driver-js-tour-kit](https://usertourkit.com/blog/migrate-driver-js-tour-kit)
