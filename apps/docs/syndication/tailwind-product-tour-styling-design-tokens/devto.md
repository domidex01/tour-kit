---
title: "Design tokens for product tour styling in Tailwind CSS v4"
published: false
description: "How to build a token-driven product tour with Tailwind v4's @theme directive. Define overlay, tooltip, and beacon tokens once, then theme every step from a single CSS file."
tags: react, tailwindcss, webdev, tutorial
canonical_url: https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens
cover_image: https://usertourkit.com/og-images/tailwind-product-tour-styling-design-tokens.png
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

You'll create a 4-step product tour where every visual property (colors, spacing, border radius, shadows, transition timing) comes from a single `@theme` block in your Tailwind v4 config. Change one token, and every tour step updates. No hunting through component files, no scattered hex values.

We'll use React with TypeScript throughout, but the patterns apply to Next.js, Vite, Remix, or plain React projects equally.

## Prerequisites

- React 18.2+ or React 19
- Tailwind CSS v4.0+ (the `@theme` directive requires v4)
- TypeScript 5.0+
- A working React project with Tailwind already configured
- Basic familiarity with CSS custom properties

## Step 1: define your tour design tokens

Tailwind v4 replaced the JavaScript `tailwind.config.js` with a CSS-first `@theme` directive that generates both CSS custom properties and utility classes from the same declaration. As of April 2026, this is the standard approach: full builds run 5x faster than v3, incremental builds clock in at 100x+ faster thanks to the Oxide engine ([Tailwind CSS docs](https://tailwindcss.com/docs/theme), [v4.0 release](https://tailwindcss.com/blog/tailwindcss-v4)).

We'll use a three-layer token architecture that the design system community has converged on ([Mavik Labs](https://www.maviklabs.com/blog/design-tokens-tailwind-v4-2026)):

1. **Base tokens**: raw primitives from Tailwind's default scale
2. **Semantic tokens**: purpose-driven mappings for your tour UI
3. **Component tokens**: specific overrides for tour variants

```css
/* src/styles/tour-tokens.css */
@import "tailwindcss";

@theme {
  /* Base tokens (pulled from Tailwind defaults) */
  --color-overlay: oklch(0.15 0.01 260 / 0.72);
  --color-surface: oklch(1 0 0);
  --color-surface-raised: oklch(0.99 0 0);
  --color-action: oklch(0.55 0.19 260);
  --color-action-hover: oklch(0.48 0.19 260);
  --color-text-primary: oklch(0.2 0.02 260);
  --color-text-secondary: oklch(0.45 0.02 260);
  --color-border: oklch(0.88 0.01 260);
  --color-focus-ring: oklch(0.55 0.19 260 / 0.5);

  /* Semantic tour tokens */
  --tour-overlay-bg: var(--color-overlay);
  --tour-tooltip-bg: var(--color-surface-raised);
  --tour-tooltip-border: var(--color-border);
  --tour-tooltip-shadow: 0 8px 24px oklch(0.15 0.01 260 / 0.12);
  --tour-tooltip-radius: 0.75rem;
  --tour-tooltip-padding: 1.25rem;

  --tour-beacon-color: var(--color-action);
  --tour-beacon-size: 1rem;

  --tour-progress-bg: var(--color-border);
  --tour-progress-fill: var(--color-action);

  /* Motion tokens */
  --duration-instant: 0ms;
  --duration-fast: 100ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --duration-slower: 500ms;

  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

  --tour-enter-duration: var(--duration-slow);
  --tour-enter-ease: var(--ease-spring);
  --tour-exit-duration: var(--duration-fast);
  --tour-exit-ease: var(--ease-out);
}
```

Tailwind v4 defaults to OKLCH color space, which gives perceptually uniform lightness across the entire palette. Your overlay opacity and focus rings look consistent regardless of the base hue.

Because every `@theme` value becomes both a CSS variable and a utility class, you can write `bg-tour-overlay-bg` in your markup or `var(--tour-overlay-bg)` in custom CSS. No extra configuration needed.

The motion tokens follow a standard duration scale. We'll wire `prefers-reduced-motion` into these later.

## Step 2: build the tour tooltip component

Tour Kit's headless components expose hooks like `useTourStep()` that manage step state and navigation callbacks while you render whatever JSX you want. One CSS file controls the look of every tour step in your app.

```tsx
// src/components/tour/TourTooltip.tsx
import { useTourStep } from "@tourkit/react";

interface TourTooltipProps {
  title: string;
  content: string;
  stepIndex: number;
  totalSteps: number;
}

export function TourTooltip({
  title,
  content,
  stepIndex,
  totalSteps,
}: TourTooltipProps) {
  const { isActive, next, prev, close } = useTourStep();

  if (!isActive) return null;

  return (
    <div
      role="dialog"
      aria-label={title}
      className="
        bg-[var(--tour-tooltip-bg)]
        border border-[var(--tour-tooltip-border)]
        rounded-[var(--tour-tooltip-radius)]
        p-[var(--tour-tooltip-padding)]
        shadow-[var(--tour-tooltip-shadow)]
        text-tour-text-primary
        animate-in fade-in slide-in-from-bottom-2
        duration-[var(--tour-enter-duration)]
      "
    >
      <h3 className="text-sm font-semibold text-[var(--color-text-primary)]">
        {title}
      </h3>
      <p className="mt-1.5 text-sm text-[var(--color-text-secondary)]">
        {content}
      </p>

      {/* Progress bar */}
      <div className="mt-4 h-1 rounded-full bg-[var(--tour-progress-bg)]">
        <div
          className="h-full rounded-full bg-[var(--tour-progress-fill)]
            transition-all duration-[var(--duration-normal)]"
          style={{ width: `${((stepIndex + 1) / totalSteps) * 100}%` }}
        />
      </div>

      {/* Navigation */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-xs text-[var(--color-text-secondary)]">
          {stepIndex + 1} of {totalSteps}
        </span>
        <div className="flex gap-2">
          {stepIndex > 0 && (
            <button
              onClick={prev}
              className="rounded-md px-3 py-1.5 text-xs font-medium
                text-[var(--color-text-secondary)]
                hover:bg-[var(--color-border)]
                transition-colors duration-[var(--duration-fast)]"
            >
              Back
            </button>
          )}
          <button
            onClick={stepIndex < totalSteps - 1 ? next : close}
            className="rounded-md px-3 py-1.5 text-xs font-medium text-white
              bg-[var(--color-action)]
              hover:bg-[var(--color-action-hover)]
              focus-visible:outline-2 focus-visible:outline-offset-2
              focus-visible:outline-[var(--color-focus-ring)]
              transition-colors duration-[var(--duration-fast)]"
          >
            {stepIndex < totalSteps - 1 ? "Next" : "Done"}
          </button>
        </div>
      </div>
    </div>
  );
}
```

Every color, radius, shadow, and timing value comes from our tokens. No hardcoded hex values anywhere. When your design team updates the brand palette, the tour updates with it automatically.

## Step 3: add ARIA-tied visibility states

Tying a component's visual state to its ARIA attributes forces developers to implement accessibility correctly by default. If the `aria-expanded` attribute is missing, the component looks broken, surfacing the gap before it ships. This pattern, described by Phil Wolstenholme ([DEV Community](https://dev.to/philw_/tying-tailwind-styling-to-aria-attributes-502f)), works well for tour beacons.

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
      className="
        relative inline-flex h-[var(--tour-beacon-size)]
        w-[var(--tour-beacon-size)] items-center justify-center
        rounded-full bg-[var(--tour-beacon-color)]

        before:absolute before:inset-0 before:rounded-full
        before:bg-[var(--tour-beacon-color)]
        before:opacity-40
        before:animate-ping
        aria-expanded:before:animate-none

        aria-expanded:opacity-0
        aria-expanded:pointer-events-none
        transition-opacity duration-[var(--tour-exit-duration)]
      "
    />
  );
}
```

Tailwind's `aria-expanded:` variant (available since v3.2) applies styles only when `aria-expanded="true"`. The beacon pulses when collapsed, vanishes when the tooltip opens.

## Step 4: wire up the tour

```tsx
// src/components/tour/ProductTour.tsx
import { TourProvider, Tour, TourStep } from "@tourkit/react";
import { TourTooltip } from "./TourTooltip";
import { TourBeacon } from "./TourBeacon";

const steps = [
  {
    target: "#dashboard-nav",
    title: "Navigation",
    content: "Your main dashboard sections live here. Start with Overview.",
  },
  {
    target: "#quick-actions",
    title: "Quick actions",
    content: "Common tasks are one click away. Try creating a new project.",
  },
  {
    target: "#notifications-bell",
    title: "Notifications",
    content: "Real-time updates about your team's activity appear here.",
  },
  {
    target: "#settings-gear",
    title: "Settings",
    content: "Customize your workspace, integrations, and team preferences.",
  },
];

export function ProductTour() {
  return (
    <TourProvider>
      <Tour id="onboarding" steps={steps}>
        {steps.map((step, index) => (
          <TourStep key={step.target} target={step.target}>
            <TourBeacon />
            <TourTooltip
              title={step.title}
              content={step.content}
              stepIndex={index}
              totalSteps={steps.length}
            />
          </TourStep>
        ))}
      </Tour>
    </TourProvider>
  );
}
```

Four steps, zero inline styles, zero hardcoded colors. The entire visual identity flows from your `@theme` tokens.

## Handling prefers-reduced-motion

Token-based motion lets you collapse every tour animation to instant with a single media query. Every duration in the system references the same set of CSS variables. Override those variables once under `prefers-reduced-motion`, and the entire tour responds.

```css
/* src/styles/tour-tokens.css */
@media (prefers-reduced-motion: reduce) {
  :root {
    --tour-enter-duration: 0ms;
    --tour-exit-duration: 0ms;
    --duration-instant: 0ms;
    --duration-fast: 0ms;
    --duration-normal: 0ms;
    --duration-slow: 0ms;
    --duration-slower: 0ms;
  }
}
```

Seven overrides. No JavaScript, no runtime checks. The browser handles it.

## Multi-brand theming with data attributes

SaaS products with white-label onboarding need per-customer tour theming. CSS custom properties make this straightforward: scope token overrides to a `data-brand` attribute on the root element.

```css
[data-brand="acme"] {
  --tour-beacon-color: oklch(0.65 0.2 145);
  --tour-tooltip-bg: oklch(0.98 0.005 145);
  --color-action: oklch(0.6 0.2 145);
  --color-action-hover: oklch(0.52 0.2 145);
}
```

Add `data-brand="acme"` to your root element and the entire tour re-themes.

## Preventing token drift

Tokens solve the initial consistency problem, but drift creeps in when developers bypass them with arbitrary values like `pl-[17px]` or hardcoded hex colors.

Three practical guardrails:

1. **Lint arbitrary values.** The `eslint-plugin-tailwindcss` plugin can flag `[17px]`-style values in CI.
2. **Co-locate tokens and components.** Keep `tour-tokens.css` in the same directory as your tour components.
3. **Review tour styling in PR diffs.** If a tour-related PR introduces a raw hex value, that's a conversation worth having.

## Common issues

### "My token utilities don't generate"

Tailwind v4 requires tokens in the `@theme` block to generate utilities. If you define a CSS variable in `:root` instead of `@theme`, it works as a variable but won't create utility classes.

### "Animations stutter on mobile Safari"

Mobile Safari handles `oklch()` transitions differently than Chromium. Add `will-change: opacity, transform` to your tooltip container during transitions, but remove it after the transition ends.

### "My tour overlay doesn't cover fixed elements"

Define z-index tokens:

```css
@theme {
  --tour-overlay-z: 9998;
  --tour-tooltip-z: 9999;
}
```

---

One limitation worth noting: Tour Kit is React-only (18+). If you're on Vue, Svelte, or Angular, the Tailwind token patterns apply but the Tour Kit integration won't work.

Full article with all code examples and FAQ: [usertourkit.com/blog/tailwind-product-tour-styling-design-tokens](https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens)
