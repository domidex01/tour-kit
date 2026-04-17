# Style your product tour with Tailwind CSS design tokens

## One CSS file to control every tour step in your app

*Originally published at [usertourkit.com](https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens)*

Most product tour libraries ship their own CSS. That CSS fights your design system, breaks your spacing scale, ignores your motion preferences. You end up overriding half the library's styles just to match your app.

What if your tour's visual identity came from the same design tokens as the rest of your UI? That's what Tailwind CSS v4's `@theme` directive makes possible.

This tutorial shows how to build a token-driven product tour using Tailwind v4 and Tour Kit, a headless React tour library. You define overlay, tooltip, and beacon tokens once, and every tour step pulls from that single source of truth.

## The three-layer token architecture

The design system community has converged on three layers for design tokens:

**Base tokens** are raw primitives — your color palette, spacing scale, and duration values. **Semantic tokens** map those primitives to purposes like "overlay background" or "action color." **Component tokens** handle variant-specific overrides.

For a product tour, this means you define `--tour-tooltip-bg`, `--tour-beacon-color`, and `--tour-enter-duration` as semantic tokens that reference your base palette. Change the base palette, and the tour updates.

Tailwind v4's `@theme` block makes this clean. Every token declared in `@theme` generates both a CSS custom property and a utility class. You get `bg-tour-overlay-bg` in your markup and `var(--tour-overlay-bg)` in custom CSS from the same declaration.

## ARIA-tied visibility

One pattern worth highlighting: tying your tour beacon's visual state to its `aria-expanded` attribute instead of a JavaScript class. Tailwind's `aria-expanded:` variant (available since v3.2) makes this a single class: `aria-expanded:opacity-0`.

The benefit? If a developer forgets the ARIA attribute, the component looks broken. A visual bug that surfaces the accessibility gap before it reaches production.

## Reduced motion in seven lines

Token-based motion gives you a clean `prefers-reduced-motion` implementation. One CSS media query overrides all duration tokens to 0ms. Every tour animation collapses to instant. No JavaScript, no runtime checks.

This is what token-based motion gets you that per-component `motion-safe:` classes can't — a single override point for the entire motion system.

## Multi-brand theming

SaaS products with white-label onboarding can scope token overrides to a `data-brand` attribute. Add `data-brand="acme"` to your root element and the entire tour re-themes through CSS cascade. No props, no context providers, no JavaScript.

## The key insight

Headless tour libraries and design tokens solve the same problem from different angles: separating what something does from how it looks. Tour Kit handles step logic, keyboard navigation, and scroll management. Tailwind tokens handle colors, spacing, and motion. Neither prescribes the other.

Tour Kit is React-only (18+). The Tailwind token patterns apply to any framework, though.

Full tutorial with all code examples, troubleshooting, and FAQ: [usertourkit.com/blog/tailwind-product-tour-styling-design-tokens](https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens)

---

*Suggested Medium publications: JavaScript in Plain English, Bits and Pieces, Better Programming*
