---
title: "Screen reader support in product tours: the developer's guide"
slug: "screen-reader-product-tour"
canonical: https://usertourkit.com/blog/screen-reader-product-tour
tags: react, accessibility, web-development, javascript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/screen-reader-product-tour)*

# Screen reader support in product tours: the developer's guide

Most product tour libraries claim WCAG compliance in their feature list but ship zero screen reader implementation guidance. Automated tools catch only 30-40% of accessibility issues, and the gap between "passes axe-core" and "works with a screen reader" is where real users get stuck.

This tutorial covers three patterns that make product tours work with screen readers: ARIA live regions for step announcements, focus management for persistent content access, and the `inert` attribute for background suppression. We build each pattern using Tour Kit and React, then test across NVDA, JAWS, and VoiceOver.

```bash
npm install @tourkit/core @tourkit/react
```

## Why product tours break screen readers

Product tours rely on visual overlays that don't exist in the accessibility tree's linear reading order. The WebAIM 2024 Survey found 67.7% of screen reader users navigate in "browse mode" using arrow keys rather than Tab. A tooltip at pixel coordinates (200, 300) has no sequential relationship to the DOM node it targets.

Three failure modes:

1. Step content renders visually but the screen reader never announces it
2. Focus stays on the previous element — user can't reach the tour step
3. Background content remains navigable — virtual cursor escapes the overlay

WCAG SC 4.1.3 (Status Messages, Level AA) requires step transitions to be programmatically determinable. As of April 2026, ADA Title II enforcement is active. Accessibility lawsuits increased 37% in 2025.

## Pattern 1: ARIA live regions

The critical detail: the live region container must exist in the DOM *before* content is injected. Tour Kit's `announce()` utility creates a `role="status"` element, inserts it, then populates it after a 100ms delay so screen readers register the container first.

```typescript
export function announce(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return

  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', politeness)
  announcer.setAttribute('aria-atomic', 'true')

  // Visually hidden but in accessibility tree
  Object.assign(announcer.style, {
    position: 'absolute', width: '1px', height: '1px',
    overflow: 'hidden', clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap', border: '0',
  })

  document.body.appendChild(announcer)
  setTimeout(() => { announcer.textContent = message }, 100)
  setTimeout(() => { document.body.removeChild(announcer) }, 1000)
}
```

Without the 100ms delay, NVDA on Firefox silently drops the announcement.

**The transient announcement problem:** Sara Soueidan warns: "Once an announcement is made, it disappears forever. They cannot be reviewed, replayed, or revealed later." Live regions alone aren't enough — you need focus management too.

## Pattern 2: Focus trapping

Tour Kit's `useFocusTrap()` hook moves focus into the step, cycles Tab within it, and restores focus on close. This makes step content persistently readable rather than a one-shot announcement.

```tsx
export function AccessibleTourCard() {
  const { currentStep, totalSteps, step } = useTour()
  const { containerRef, activate, deactivate } = useFocusTrap()

  useEffect(() => {
    announce(getStepAnnouncement(step?.title, currentStep, totalSteps))
    activate()
    return () => deactivate()
  }, [currentStep, step, totalSteps, activate, deactivate])

  return (
    <div ref={containerRef} role="dialog"
      aria-labelledby={`tour-step-title-${step?.id}`}
      aria-modal="true">
      <h2 id={`tour-step-title-${step?.id}`}>{step?.title}</h2>
      <p>{step?.content}</p>
    </div>
  )
}
```

## Pattern 3: Background suppression with `inert`

The `inert` attribute removes elements from both tab order and accessibility tree. Unlike `aria-modal="true"` (inconsistent across screen readers), `inert` works consistently in every modern browser since March 2023.

```typescript
export function useInertBackground(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return
    const main = document.querySelector('main')
    if (!main) return
    main.setAttribute('inert', '')
    return () => main.removeAttribute('inert')
  }, [isActive])
}
```

The tour step container must live outside `<main>` for this to work.

## Testing checklist

Test against NVDA (30.7% usage, free) and VoiceOver (10.1% desktop):

1. Step announcement fires when step opens
2. Focus moves into the step container
3. Tab cycles only within the step
4. Browse mode (arrow keys) stays within the step
5. Escape closes the tour
6. Focus returns to previous element after close
7. Step counter reads correctly
8. Button labels are descriptive

---

Full article with comparison table across 5 libraries and complete troubleshooting guide: [usertourkit.com/blog/screen-reader-product-tour](https://usertourkit.com/blog/screen-reader-product-tour)
