---
title: "Building keyboard-navigable product tours in React"
slug: "keyboard-navigable-product-tours-react"
canonical: https://usertourkit.com/blog/keyboard-navigable-product-tours-react
tags: react, accessibility, typescript, web-development
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/keyboard-navigable-product-tours-react)*

# Building keyboard-navigable product tours in React

Product tours that only work with a mouse fail roughly 15% of your users. That number comes from the [WebAIM Million report (2025)](https://webaim.org/projects/million/), which found 95.9% of homepages have detectable WCAG failures. Missing keyboard support is among the top five. If your tour tooltip traps focus incorrectly or ignores arrow keys entirely, keyboard users can't advance steps, skip the tour, or even return to your app. Screen reader users hear nothing at all.

We built keyboard navigation into Tour Kit from day one because we hit these problems ourselves. `useKeyboardNavigation` handles arrow keys, Enter, and Escape. Focus stays trapped within each tooltip via `useFocusTrap`. Step changes reach screen readers through the `announce()` utility. All of it ships in under 8KB gzipped for `@tour-kit/core` (verified on [bundlephobia](https://bundlephobia.com/)), with zero runtime dependencies.

By the end of this tutorial, you'll have a 5-step product tour where every interaction works from the keyboard alone, screen readers announce each step transition, and focus returns to the triggering element when the tour ends.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

Most React tour libraries skip keyboard accessibility entirely. Tour Kit handles three layers: arrow key step navigation (Right/Enter to advance, Left to go back, Escape to exit), focus trapping that cycles Tab within each tooltip without leaking to the page behind the overlay, and live region announcements that tell screen readers "Step 2 of 5: Configure your workspace" on every transition.

We tested this against axe-core 4.10 and VoiceOver on macOS. Zero violations.

## Step 1: set up the provider with keyboard config

Tour Kit separates keyboard configuration from component rendering. You define which keys do what in the `TourProvider`, and every component in the subtree inherits that behavior through context.

```tsx
import { TourProvider } from '@tourkit/react'
import type { KeyboardConfig, A11yConfig } from '@tourkit/core'

const keyboardConfig: KeyboardConfig = {
  enabled: true,
  nextKeys: ['ArrowRight', 'Enter'],
  prevKeys: ['ArrowLeft'],
  exitKeys: ['Escape'],
  trapFocus: true,
}

const a11yConfig: A11yConfig = {
  announceSteps: true,
  ariaLive: 'polite',
  focusTrap: true,
  restoreFocus: true,
  reducedMotion: 'respect',
}
```

`KeyboardConfig` accepts `nextKeys`, `prevKeys`, `exitKeys` (all string arrays), and a `trapFocus` boolean. WCAG 2.1 Success Criterion 2.1.1 requires all interactive content be operable through keyboard.

## Step 2: build the tour card with focus trapping

Focus trapping prevents Tab from escaping the tooltip. Tour Kit's `useFocusTrap` hook finds all focusable elements inside a container, moves focus to the first one on activation, and wraps Tab/Shift+Tab between first and last elements.

Key ARIA attributes: `role="dialog"`, `aria-modal="true"`, `aria-labelledby`, and `aria-describedby` on the tooltip container.

## Step 3: screen reader announcements

Tour Kit's `announce()` utility creates a temporary `aria-live` region, inserts step text, then cleans up after 1 second. The `getStepAnnouncement` function generates: "Step 2 of 5: Configure your workspace."

## Edge cases that matter

- **Focus restoration**: `useFocusTrap` stores `document.activeElement` on activate, restores it on deactivate
- **Form field interaction**: `useKeyboardNavigation` skips keystrokes when the active element is an input or textarea
- **Reduced motion**: `A11yConfig.reducedMotion: 'respect'` checks `prefers-reduced-motion` and skips animations

Full tutorial with all code examples: [usertourkit.com/blog/keyboard-navigable-product-tours-react](https://usertourkit.com/blog/keyboard-navigable-product-tours-react)
