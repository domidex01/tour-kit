---
title: "Tailwind CSS product tour styling: a design tokens approach"
slug: "tailwind-product-tour-styling-design-tokens"
canonical: https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens
tags: react, tailwindcss, web-development, typescript
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens)*

# Tailwind CSS product tour styling with design tokens

Most product tour libraries ship their own CSS. That CSS fights your design system, breaks your spacing scale, ignores your motion preferences. You end up overriding half the library's styles just to match your app.

Tour Kit ships zero CSS. You bring your own Tailwind classes, tokens, and components. The tour logic handles step sequencing and scroll management while you handle everything visual.

This tutorial builds a token-driven product tour using Tailwind CSS v4's `@theme` directive and Tour Kit. You'll define base, semantic, and component tokens for overlays, tooltips, and beacons, then wire them into headless components that respect your design system and `prefers-reduced-motion`.

```bash
npm install @tourkit/core @tourkit/react
```

## What you'll build

You'll create a 4-step product tour where every visual property (colors, spacing, border radius, shadows, transition timing) comes from a single `@theme` block in your Tailwind v4 config. Change one token, and every tour step updates.

## Prerequisites

- React 18.2+ or React 19
- Tailwind CSS v4.0+ (the `@theme` directive requires v4)
- TypeScript 5.0+
- A working React project with Tailwind already configured

## Step 1: define your tour design tokens

Tailwind v4 replaced `tailwind.config.js` with a CSS-first `@theme` directive that generates both CSS custom properties and utility classes from the same declaration. Full builds run 5x faster than v3, incremental builds are 100x+ faster.

We use a three-layer token architecture:

1. **Base tokens**: raw primitives from Tailwind's default scale
2. **Semantic tokens**: purpose-driven mappings for your tour UI
3. **Component tokens**: specific overrides for tour variants

```css
/* src/styles/tour-tokens.css */
@import "tailwindcss";

@theme {
  --color-overlay: oklch(0.15 0.01 260 / 0.72);
  --color-surface: oklch(1 0 0);
  --color-surface-raised: oklch(0.99 0 0);
  --color-action: oklch(0.55 0.19 260);
  --color-action-hover: oklch(0.48 0.19 260);
  --color-text-primary: oklch(0.2 0.02 260);
  --color-text-secondary: oklch(0.45 0.02 260);
  --color-border: oklch(0.88 0.01 260);

  --tour-overlay-bg: var(--color-overlay);
  --tour-tooltip-bg: var(--color-surface-raised);
  --tour-tooltip-border: var(--color-border);
  --tour-tooltip-shadow: 0 8px 24px oklch(0.15 0.01 260 / 0.12);
  --tour-tooltip-radius: 0.75rem;
  --tour-tooltip-padding: 1.25rem;

  --tour-beacon-color: var(--color-action);
  --tour-beacon-size: 1rem;

  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;

  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);
  --tour-enter-duration: var(--duration-slow);
  --tour-enter-ease: var(--ease-spring);
  --tour-exit-duration: var(--duration-fast);
}
```

Every `@theme` value becomes both a CSS variable and a utility class. Write `bg-tour-overlay-bg` in markup or `var(--tour-overlay-bg)` in custom CSS.

## Step 2: build the tour tooltip

```tsx
// src/components/tour/TourTooltip.tsx
import { useTourStep } from "@tourkit/react";

interface TourTooltipProps {
  title: string;
  content: string;
  stepIndex: number;
  totalSteps: number;
}

export function TourTooltip({ title, content, stepIndex, totalSteps }: TourTooltipProps) {
  const { isActive, next, prev, close } = useTourStep();
  if (!isActive) return null;

  return (
    <div
      role="dialog"
      aria-label={title}
      className="bg-[var(--tour-tooltip-bg)] border border-[var(--tour-tooltip-border)]
        rounded-[var(--tour-tooltip-radius)] p-[var(--tour-tooltip-padding)]
        shadow-[var(--tour-tooltip-shadow)]"
    >
      <h3 className="text-sm font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">{content}</p>
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs">{stepIndex + 1} of {totalSteps}</span>
        <div className="flex gap-2">
          {stepIndex > 0 && <button onClick={prev}>Back</button>}
          <button onClick={stepIndex < totalSteps - 1 ? next : close}>
            {stepIndex < totalSteps - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Every value comes from tokens. No hardcoded hex, no magic numbers.

## Step 3: ARIA-tied beacon visibility

Tie the beacon's display to its `aria-expanded` attribute. If a developer forgets the ARIA attribute, the component looks broken, surfacing the accessibility gap before it ships.

```tsx
// src/components/tour/TourBeacon.tsx
import { useTourStep } from "@tourkit/react";

export function TourBeacon() {
  const { isActive, activate } = useTourStep();
  return (
    <button
      onClick={activate}
      aria-expanded={isActive}
      aria-label="Show tour step"
      className="relative rounded-full bg-[var(--tour-beacon-color)]
        before:animate-ping before:bg-[var(--tour-beacon-color)]
        aria-expanded:before:animate-none
        aria-expanded:opacity-0 aria-expanded:pointer-events-none"
    />
  );
}
```

## Reduced motion in one override

```css
@media (prefers-reduced-motion: reduce) {
  :root {
    --tour-enter-duration: 0ms;
    --tour-exit-duration: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
  }
}
```

One media query, every animation collapses to instant. No JavaScript.

## Multi-brand theming

```css
[data-brand="acme"] {
  --tour-beacon-color: oklch(0.65 0.2 145);
  --tour-tooltip-bg: oklch(0.98 0.005 145);
  --color-action: oklch(0.6 0.2 145);
}
```

Add `data-brand="acme"` to your root element. The entire tour re-themes via CSS cascade.

---

Tour Kit is React-only (18+). The Tailwind token patterns apply to any framework, but the Tour Kit integration requires React.

Full article with FAQ and troubleshooting: [usertourkit.com/blog/tailwind-product-tour-styling-design-tokens](https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens)
