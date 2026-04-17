---
title: "CSS layers and product tour styles: avoiding specificity conflicts"
slug: "css-layers-product-tour-styles"
canonical: https://usertourkit.com/blog/css-layers-product-tour-styles
tags: css, react, web-development, tailwind-css
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/css-layers-product-tour-styles)*

# CSS layers and product tour styles: avoiding specificity conflicts

You add a product tour library to your React app. The tooltips render. Then your app's button styles bleed into the tour popover, your overlay hides behind a modal, and someone on your team adds `!important` to fix it. Two sprints later the entire tooltip is styled with `!important` declarations and nobody wants to touch the CSS.

CSS cascade layers (`@layer`) fix this by replacing the specificity arms race with explicit priority ordering. Instead of fighting your app's stylesheet, you declare which styles win and which yield at parse time, with zero runtime cost.

## What is a CSS cascade layer?

A CSS cascade layer is a named priority tier created with the `@layer` at-rule. When two CSS rules target the same element, the layer each belongs to determines which wins, not the selector's specificity and not the source order in your stylesheet. As of April 2026, `@layer` has approximately 96% global browser support (Chrome 99+, Firefox 97+, Safari 15.4+) and requires no polyfill.

Despite four years of availability, only about 2.71% of production websites use `@layer` outside of framework internals like Tailwind (Project Wallace CSS Selection 2026). That gap between support and adoption is why specificity conflicts keep plaguing component library integrations.

Layers declared first have the lowest priority. Layers declared last have the highest. Any CSS written outside a layer beats all layered styles automatically.

```css
/* Priority: reset < base < components < utilities */
@layer reset, base, components, utilities;

@layer base {
  .tooltip { background: white; }
}

@layer utilities {
  .bg-slate-900 { background: rgb(15 23 42); }
}
```

Here `.bg-slate-900` wins over `.tooltip`'s background, regardless of specificity or source order.

## Why product tours have a specificity problem

Product tour libraries inject UI into your existing page. Tooltips, overlays, spotlights, and step popovers all compete with your app's styles for the same CSS properties on the same DOM elements. Three failure modes show up repeatedly:

1. **Z-index stacking context traps** — Portalled overlays with `z-index: 9999` render behind app modals when a parent has `transform` or `opacity` set.
2. **Specificity arms race** — Bootstrap v5.3 assigns tooltip z-index at 1,070 and modal z-index at 1,055. Your tour overlay is playing a number guessing game.
3. **Source order fragility** — Code-splitting makes stylesheet load order non-deterministic between deploys.

## How @layer solves the cascade conflict

```css
/* Declare layer order once, at the top of your entry CSS */
@layer reset, third-party, host-app, tour-kit.base, tour-kit.theme, utilities;
```

This single line establishes priority. Tour styles sit in a predictable layer. Host app styles can override them without `!important`. Critical overlay styles placed outside any layer always win.

```css
@layer tour-kit.base {
  .tk-tooltip {
    position: absolute;
    background: var(--tk-bg, white);
    border-radius: var(--tk-radius, 8px);
    padding: var(--tk-padding, 16px);
  }
}

/* Critical overlay — unlayered, wins everything */
.tk-overlay-lockout {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: all;
}
```

## Tailwind CSS integration

Two approaches when adding a tour library alongside Tailwind:

**Option A:** Register tour styles inside `@layer components` — utilities override tour defaults automatically.

**Option B (recommended):** Declare tour-kit as its own named layer between components and utilities:

```css
@layer theme, base, components, tour-kit, utilities;
```

Predictable override behavior without `@apply` directives.

## Why shadow DOM isn't the answer

Shadow DOM creates bidirectional isolation. It blocks focus management, keyboard event bubbling, and `aria-describedby` references across shadow boundaries. CSS layers give priority control without breaking accessibility.

| Approach | Isolation | Runtime cost | Tour fit |
|---|---|---|---|
| Shadow DOM | Bidirectional | Web Component overhead | Poor |
| CSS @layer | Priority ordering | Zero | Excellent |

## Common mistakes

- Declaring layers in multiple files without a shared order
- Using `@import` without `layer()` (loads as unlayered, beats everything)
- Forgetting `!important` reverses layer priority
- Assuming `@layer` fixes z-index (layers control cascade, not paint order)

---

Full article with complete implementation examples: [usertourkit.com/blog/css-layers-product-tour-styles](https://usertourkit.com/blog/css-layers-product-tour-styles)
