---
title: "Making product tours work with screen readers (ARIA live regions + focus traps + inert)"
published: false
description: "Most product tour libraries claim WCAG compliance but ship zero screen reader guidance. Here's how to build tours that actually work with NVDA, JAWS, and VoiceOver using three patterns: ARIA live regions, focus trapping, and the inert attribute."
tags: react, accessibility, webdev, tutorial
canonical_url: https://usertourkit.com/blog/screen-reader-product-tour
cover_image: https://usertourkit.com/og-images/screen-reader-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/screen-reader-product-tour)*

# Screen reader support in product tours: the developer's guide

Most product tour libraries claim WCAG compliance in their feature list but ship zero screen reader implementation guidance. The result: tours that look accessible in a Lighthouse audit but leave NVDA and VoiceOver users stranded, unable to read step content or navigate between steps. Automated tools catch only 30-40% of accessibility issues, and the gap between "passes axe-core" and "works with a screen reader" is where real users get stuck.

This tutorial covers the three patterns that make product tours actually work with screen readers: ARIA live regions for step announcements, focus management for persistent content access, and the `inert` attribute for background suppression.

```bash
npm install @tourkit/core @tourkit/react
```

## Why product tours break screen readers

Product tours break screen readers because they rely on visual overlays that don't exist in the accessibility tree's linear reading order. The WebAIM 2024 Screen Reader User Survey found that 67.7% of screen reader users browse in "browse mode" (virtual cursor), navigating DOM elements sequentially with arrow keys rather than Tab stops.

Three failure modes happen in practice:

1. The step content renders visually but the screen reader never announces it — no `aria-live` region, no announcement
2. Focus stays on the previous element, so the user can't reach the tour step
3. Background content remains navigable, meaning the virtual cursor can wander behind the overlay

WCAG Success Criterion 4.1.3 (Status Messages, Level AA) requires that status messages be programmatically determinable through role or properties. Every step transition is a status message. As of April 24, 2026, ADA Title II enforcement is active and accessibility lawsuits increased 37% in 2025.

## Step 1: ARIA live regions for step announcements

The critical detail most implementations get wrong: the live region container must exist in the DOM *before* content is injected into it. Sara Soueidan's research explains why: "Place the live region container in the DOM as early as possible and then populate it with the contents of the message using JavaScript when the notification needs to be announced."

Here's how Tour Kit handles this:

```typescript
// src/utils/a11y.ts — Tour Kit's announce utility
export function announce(
  message: string,
  politeness: 'polite' | 'assertive' = 'polite'
): void {
  if (typeof document === 'undefined') return

  const announcer = document.createElement('div')
  announcer.setAttribute('role', 'status')
  announcer.setAttribute('aria-live', politeness)
  announcer.setAttribute('aria-atomic', 'true')

  // Visually hidden but present in accessibility tree
  Object.assign(announcer.style, {
    position: 'absolute',
    width: '1px',
    height: '1px',
    overflow: 'hidden',
    clip: 'rect(0, 0, 0, 0)',
    whiteSpace: 'nowrap',
    border: '0',
  })

  document.body.appendChild(announcer)

  // 100ms delay: gives SR time to register the container
  setTimeout(() => {
    announcer.textContent = message
  }, 100)

  // Cleanup after 1 second
  setTimeout(() => {
    document.body.removeChild(announcer)
  }, 1000)
}
```

The 100ms delay between creating the element and setting its text content is the key. Without it, NVDA on Firefox silently drops the announcement.

### The transient announcement problem

There's a catch with live regions that no product tour library documents. Sara Soueidan warns: "Once an announcement is made, it disappears forever. They cannot be reviewed, replayed, or revealed later."

If a screen reader user misses the announcement, the step content is gone. They can't re-read it. This is why live regions alone aren't enough — you need focus management too.

## Step 2: focus trapping per step

Tour Kit's `useFocusTrap()` hook moves focus into the tour step container when it opens, cycles Tab between focusable elements within the step, and restores focus to the previously-active element on close. This adds approximately 1KB to your bundle and solves the transient announcement problem.

```typescript
// src/hooks/use-focus-trap.ts
import { useCallback, useEffect, useRef } from 'react'

export function useFocusTrap(enabled = true) {
  const containerRef = useRef<HTMLElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)

  const activate = useCallback(() => {
    if (!enabled || !containerRef.current) return
    previousActiveElement.current = document.activeElement as HTMLElement
    const focusable = getFocusableElements(containerRef.current)
    if (focusable.length > 0) focusable[0].focus()
  }, [enabled])

  const deactivate = useCallback(() => {
    if (previousActiveElement.current) {
      previousActiveElement.current.focus()
      previousActiveElement.current = null
    }
  }, [])

  return { containerRef, activate, deactivate }
}
```

Wire the focus trap into your tour card:

```tsx
// src/components/AccessibleTourCard.tsx
import { useFocusTrap, getStepAnnouncement, announce } from '@tourkit/core'
import { useTour } from '@tourkit/react'
import { useEffect } from 'react'

export function AccessibleTourCard() {
  const { currentStep, totalSteps, step } = useTour()
  const { containerRef, activate, deactivate } = useFocusTrap()

  useEffect(() => {
    announce(getStepAnnouncement(step?.title, currentStep, totalSteps))
    activate()
    return () => deactivate()
  }, [currentStep, step, totalSteps, activate, deactivate])

  return (
    <div
      ref={containerRef}
      role="dialog"
      aria-labelledby={`tour-step-title-${step?.id}`}
      aria-describedby={`tour-step-desc-${step?.id}`}
      aria-modal="true"
    >
      <h2 id={`tour-step-title-${step?.id}`}>{step?.title}</h2>
      <p id={`tour-step-desc-${step?.id}`}>{step?.content}</p>
    </div>
  )
}
```

## Step 3: suppress background with `inert`

The `inert` HTML attribute removes an element from the tab order and accessibility tree in a single declaration. While `aria-modal="true"` exists for the same purpose, real-world support is inconsistent across NVDA, JAWS, and VoiceOver. The `inert` attribute has consistent behavior across every modern browser since March 2023.

```typescript
// src/hooks/useInertBackground.ts
import { useEffect } from 'react'

export function useInertBackground(isActive: boolean) {
  useEffect(() => {
    if (!isActive) return
    const mainContent = document.querySelector('main')
    if (!mainContent) return
    mainContent.setAttribute('inert', '')
    return () => mainContent.removeAttribute('inert')
  }, [isActive])
}
```

One caveat: the tour step container must live *outside* the `<main>` element. Tour Kit renders tour content in a portal outside the main content area for this reason.

## Testing across screen readers

Manual testing across at least two screen readers is required. Automated tools can't verify that announcements fire, that focus moves correctly, or that reading order makes sense.

**NVDA** (30.7% of usage, free): The most literal screen reader. Test with Firefox and Chrome — NVDA behaves differently across browsers for `aria-live` timing.

**JAWS** (40.5% of usage, $95/year): The most forgiving reader. It applies heuristics to compensate for missing ARIA attributes. Test JAWS second, after fixing issues found in NVDA.

**VoiceOver** (10.1% desktop, free): Ships with macOS/iOS. VoiceOver processes `aria-live` announcements with ~250ms delay compared to NVDA's ~100ms.

### Minimal test checklist

1. Step announcement fires when the step opens
2. Focus moves into the step container
3. Tab cycles only within the step
4. Screen reader browse mode stays within the step
5. Escape key closes the tour
6. Focus returns to the previous element after close
7. Step counter reads correctly ("Step 2 of 4")
8. Button labels are descriptive ("Next step 3 of 4", not just "Next")

## Common issues

- **NVDA doesn't announce transitions**: Live region container created and populated in the same DOM mutation. Fix: 100ms delay.
- **VoiceOver reads entire page after closing**: Focus not restored. Fix: store `document.activeElement` before trap activation.
- **SR cursor escapes the step**: `aria-modal` alone isn't enough. Fix: add `inert` attribute to `<main>`.
- **JAWS announces 'blank' for title**: `aria-labelledby` references ID that doesn't exist yet. Fix: render title in same commit as dialog.

---

Full article with comparison table and complete code examples: [usertourkit.com/blog/screen-reader-product-tour](https://usertourkit.com/blog/screen-reader-product-tour)

Tour Kit is an open-source headless product tour library for React. [GitHub](https://github.com/AnnaBurd/tour-kit) | [Docs](https://usertourkit.com/docs)
