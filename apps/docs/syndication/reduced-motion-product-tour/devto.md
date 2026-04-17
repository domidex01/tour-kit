---
title: "How to add prefers-reduced-motion to React product tours"
published: false
description: "35% of US adults 40+ have experienced vestibular dysfunction. Here's how to make your product tours respect their OS motion preference with a React hook, CSS fallbacks, and an in-tour toggle."
tags: react, webdev, a11y, tutorial
canonical_url: https://usertourkit.com/blog/reduced-motion-product-tour
cover_image: https://usertourkit.com/og-images/reduced-motion-product-tour.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/reduced-motion-product-tour)*

# Reduced motion support in product tour animations

Product tours stack motion effects. A tooltip slides in, the spotlight pulses, a progress bar fills, then the tooltip slides out and the next one appears. Each animation might be mild on its own. Strung together across a 7-step tour, they can trigger vertigo, nausea, or migraines in people with vestibular disorders.

About 35% of US adults over 40 have experienced some form of vestibular dysfunction ([Josh W. Comeau, sourced from NIH data](https://www.joshwcomeau.com/react/prefers-reduced-motion/)). That number doesn't include users with ADHD, epilepsy, or traumatic brain injuries who are also affected by excessive motion.

Most product tour libraries ship without any `prefers-reduced-motion` support. We checked every major onboarding guide published in 2026 by Walnut, ProductFruits, and Intercom. None mention the media query. That's a problem, and it's straightforward to fix.

This tutorial shows you how to build a reduced motion product tour in React using Tour Kit. You'll detect the OS preference, swap slide-in animations for instant opacity fades, add an in-tour toggle for users who don't know about OS settings, and test the whole thing in Playwright.

```bash
npm install @tourkit/core @tourkit/react
```

## Step 1: understand what reduced motion actually means

The `prefers-reduced-motion` CSS media query maps to an OS-level accessibility setting that roughly 35% of vestibular disorder sufferers rely on, yet most product tour libraries ignore entirely. WCAG 2.1 Success Criterion 2.3.3 states that "motion animation triggered by interaction can be disabled, unless the animation is essential to the functionality or the information being conveyed" ([W3C, WCAG 2.1](https://www.w3.org/WAI/WCAG21/Understanding/animation-from-interactions.html)). The key word is "essential." An animation is essential when removing it fundamentally changes the information or functionality.

For product tours, that means:

- Tooltip slide-in/slide-out transitions? Non-essential. Remove or reduce them.
- Spotlight pulse effects? Non-essential. Replace with a static highlight ring.
- Progress bar fill animation? Borderline. A static filled bar conveys the same info.
- Step content appearing on screen? The content itself is essential. The animation bringing it in is not.

One anti-pattern to avoid: the blanket `* { animation: none !important }` reset. As [Michelle Barker wrote for Smashing Magazine](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/), "reduced motion doesn't necessarily mean removing all transforms." That approach kills focus ring animations, button feedback states, and loading spinners that users actually need.

## Step 2: detect the preference with a React hook

Tour Kit's `@tour-kit/core` package exports a `usePrefersReducedMotion` hook that wraps `window.matchMedia('(prefers-reduced-motion: reduce)')` with SSR safety and live change detection.

```tsx
// packages/core/src/hooks/use-media-query.ts
import { useEffect, useState } from 'react'

export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(() => {
    if (typeof window === 'undefined') return false
    return window.matchMedia(query).matches
  })

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia(query)
    const handler = (e: MediaQueryListEvent) => setMatches(e.matches)

    setMatches(mediaQuery.matches)
    mediaQuery.addEventListener('change', handler)

    return () => mediaQuery.removeEventListener('change', handler)
  }, [query])

  return matches
}

export function usePrefersReducedMotion(): boolean {
  return useMediaQuery('(prefers-reduced-motion: reduce)')
}
```

The hook initializes from `window.matchMedia` on the client and defaults to `false` during SSR. It listens for live changes, so if a user toggles the OS setting mid-session, the tour adapts instantly without a page reload.

Using it in your component:

```tsx
// src/components/ProductTour.tsx
import { usePrefersReducedMotion } from '@tourkit/core'

export function ProductTour() {
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div
      className={reducedMotion
        ? 'opacity-100 transition-opacity duration-150'
        : 'animate-tour-fade-in transition-all duration-200'
      }
    >
      {/* Tour card content */}
    </div>
  )
}
```

## Step 3: build motion-safe tour step transitions

Here's a complete tour step component implementing reduced alternatives:

```tsx
// src/components/MotionSafeTourCard.tsx
'use client'

import { usePrefersReducedMotion } from '@tourkit/core'
import { useTour } from '@tourkit/react'
import { cn } from '@/lib/utils'

interface TourCardProps {
  children: React.ReactNode
  className?: string
}

export function MotionSafeTourCard({ children, className }: TourCardProps) {
  const { currentStep, totalSteps, next, prev, stop } = useTour()
  const reducedMotion = usePrefersReducedMotion()

  return (
    <div
      role="dialog"
      aria-label={`Tour step ${currentStep + 1} of ${totalSteps}`}
      className={cn(
        'rounded-lg border bg-popover p-4 shadow-lg',
        reducedMotion
          ? 'animate-none opacity-100 transition-opacity duration-150'
          : 'animate-tour-fade-in',
        className
      )}
    >
      {children}

      {/* Progress bar */}
      <div className="mt-3 h-1 w-full rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full bg-primary',
            !reducedMotion && 'transition-[width] duration-300'
          )}
          style={{ width: `${((currentStep + 1) / totalSteps) * 100}%` }}
        />
      </div>

      <div className="mt-3 flex justify-between">
        <button onClick={prev} disabled={currentStep === 0}>
          Back
        </button>
        <button onClick={currentStep === totalSteps - 1 ? stop : next}>
          {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
        </button>
      </div>
    </div>
  )
}
```

## Step 4: handle the spotlight pulse

Pulsing animations are one of the strongest vestibular triggers. Replace with a static ring:

```css
/* Default: animated pulse */
.tour-spotlight {
  animation: tour-pulse 2s ease-in-out infinite;
}

/* Reduced: static ring, no animation */
@media (prefers-reduced-motion: reduce) {
  .tour-spotlight {
    animation: none;
    box-shadow: 0 0 0 3px hsl(var(--primary) / 0.4);
  }
}
```

The CSS media query approach applies before JavaScript loads, so there's no flash of animation during hydration.

## Step 5: add an in-tour motion toggle

Not everyone knows where to find the reduced motion toggle in their OS settings. A toggle inside the tour itself catches users who need it:

```tsx
// src/components/MotionToggle.tsx
'use client'

import { useState, useEffect } from 'react'
import { usePrefersReducedMotion } from '@tourkit/core'

export function MotionToggle() {
  const osPreference = usePrefersReducedMotion()
  const [userOverride, setUserOverride] = useState<boolean | null>(null)

  useEffect(() => {
    const saved = localStorage.getItem('tour-kit-reduced-motion')
    if (saved !== null) setUserOverride(saved === 'true')
  }, [])

  const isReduced = userOverride ?? osPreference

  const toggle = () => {
    const next = !isReduced
    setUserOverride(next)
    localStorage.setItem('tour-kit-reduced-motion', String(next))
  }

  return (
    <button
      role="switch"
      aria-checked={isReduced}
      aria-label="Reduce tour animations"
      onClick={toggle}
      className="flex items-center gap-2 text-xs text-muted-foreground"
    >
      <span
        className={`inline-block h-4 w-7 rounded-full transition-colors ${
          isReduced ? 'bg-primary' : 'bg-muted'
        }`}
      >
        <span
          className={`block h-3 w-3 translate-y-0.5 rounded-full bg-white ${
            isReduced ? 'translate-x-3.5' : 'translate-x-0.5'
          }`}
        />
      </span>
      Reduce motion
    </button>
  )
}
```

The `role="switch"` with `aria-checked` is the correct ARIA pattern for a toggle.

## Testing reduced motion in Playwright

Playwright has built-in support for emulating the reduced motion preference:

```ts
// tests/reduced-motion.spec.ts
import { test, expect } from '@playwright/test'

test.describe('reduced motion', () => {
  test('tour respects prefers-reduced-motion', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' })
    await page.goto('/app')

    await page.click('[data-tour-start]')

    const card = page.locator('[data-tour-card]')
    await expect(card).toBeVisible()

    const animation = await card.evaluate((el) => {
      return window.getComputedStyle(el).animationName
    })
    expect(animation).toBe('none')
  })

  test('motion toggle persists across page reload', async ({ page }) => {
    await page.goto('/app')
    await page.click('[data-tour-start]')

    await page.click('[role="switch"][aria-label="Reduce tour animations"]')

    await page.reload()
    await page.click('[data-tour-start]')

    const toggle = page.locator('[role="switch"][aria-label="Reduce tour animations"]')
    await expect(toggle).toHaveAttribute('aria-checked', 'true')
  })
})
```

## FAQ

### Does Tour Kit automatically handle prefers-reduced-motion?

Tour Kit exports a `usePrefersReducedMotion` hook from `@tour-kit/core` that detects the OS media query and listens for live changes. As a headless library, Tour Kit provides detection tools while you control the animation implementation in your components.

### What WCAG criterion does prefers-reduced-motion satisfy?

The `prefers-reduced-motion` media query primarily supports WCAG 2.1 Success Criterion 2.3.3 (Animation from Interactions), a Level AAA criterion. It also helps meet SC 2.2.2 (Pause, Stop, Hide) at Level A for auto-advancing tour sequences.

### Should I remove all animations or just reduce them?

Reduce, don't remove. Replace spatial transforms (slides, scales, rotations) with opacity fades or instant transitions. Keep subtle feedback like focus indicators and button hover states. As Michelle Barker wrote in [Smashing Magazine](https://www.smashingmagazine.com/2021/10/respecting-users-motion-preferences/), blanket `animation: none` removes helpful micro-interactions that users rely on.

### How do I test reduced motion in CI?

Playwright supports `page.emulateMedia({ reducedMotion: 'reduce' })` to simulate the OS preference in headless browsers. For React component tests with Vitest, mock `window.matchMedia` to return `matches: true` for the `(prefers-reduced-motion: reduce)` query.

### How many users actually enable reduced motion?

Exact adoption numbers are hard to find because the preference is client-side and rarely tracked. The underlying need is significant: 35% of US adults over 40 have experienced vestibular dysfunction, and roughly 5% have chronic vestibular problems ([NIH data via Josh W. Comeau](https://www.joshwcomeau.com/react/prefers-reduced-motion/)).
