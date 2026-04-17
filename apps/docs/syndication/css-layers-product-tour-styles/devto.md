---
title: "CSS @layer fixed our product tour styling nightmares"
published: false
description: "How CSS cascade layers eliminate specificity conflicts between product tour components and your app's styles. Includes Tailwind integration patterns and a Shadow DOM comparison."
tags: css, react, webdev, tutorial
canonical_url: https://usertourkit.com/blog/css-layers-product-tour-styles
cover_image: https://usertourkit.com/og-images/css-layers-product-tour-styles.png
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/css-layers-product-tour-styles)*

# CSS layers and product tour styles: avoiding specificity conflicts

You add a product tour library to your React app. The tooltips render. Then your app's button styles bleed into the tour popover, your overlay hides behind a modal, and someone on your team adds `!important` to fix it. Two sprints later the entire tooltip is styled with `!important` declarations and nobody wants to touch the CSS.

CSS cascade layers (`@layer`) fix this by replacing the specificity arms race with explicit priority ordering. Instead of fighting your app's stylesheet, you declare which styles win and which yield at parse time, with zero runtime cost.

## What is a CSS cascade layer?

A CSS cascade layer is a named priority tier created with the `@layer` at-rule. When two CSS rules target the same element, the layer each belongs to determines which wins, not the selector's specificity and not the source order in your stylesheet. As of April 2026, `@layer` has approximately 96% global browser support (Chrome 99+, Firefox 97+, Safari 15.4+) and requires no polyfill. Despite four years of availability, only about 2.71% of production websites use `@layer` outside of framework internals like Tailwind (Project Wallace CSS Selection 2026).

That gap between support and adoption is why specificity conflicts keep plaguing component library integrations.

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

Here `.bg-slate-900` wins over `.tooltip`'s background, regardless of specificity or source order. A single class selector in a higher layer beats `#app .card .tooltip.active` in a lower layer.

## Why product tours have a specificity problem

Product tour libraries inject UI into your existing page. Tooltips, overlays, spotlights, and step popovers all compete with your app's styles for the same CSS properties on the same DOM elements. We measured three failure modes that show up repeatedly.

### The z-index stacking context trap

Tour overlays portalled to `document.body` with `z-index: 9999` still render behind app modals. Why? Because z-index comparison only works within the same stacking context. An app modal inside a parent with `transform: translateZ(0)` or `opacity: 0.99` creates its own context. The tour overlay, sitting in the root context, can't compete regardless of its z-index value.

Josh Comeau explains this well: "There is no way to 'break free' of a stacking context, and an element inside one stacking context can never be compared against elements in another."

### The specificity arms race

Your app uses Bootstrap, MUI, or a custom design system. The components ship with selectors like `.btn-primary`, `.MuiTooltip-root`, or `.card-header`. When a tour library tries to highlight or dim these elements, its selectors must match or exceed the app's specificity. That means increasingly specific selectors, and eventually `!important`.

Bootstrap v5.3 assigns tooltip z-index at 1,070 and modal z-index at 1,055. A tour overlay trying to sit between these two values is playing a number guessing game that breaks the moment Bootstrap ships a patch.

### Source order fragility

With code-splitting and async CSS loading, the order your stylesheets arrive in isn't deterministic. A tour library's styles might load before or after the app's framework CSS depending on the bundle chunk graph. Whoever loads last wins on equal specificity, and that order can change between deploys.

## How @layer solves the cascade conflict

CSS cascade layers replace all three of these heuristics (specificity, source order, `!important` count) with a single predictable dimension: layer position.

Here's a layer stack built for a React app with a tour library:

```css
/* Declare layer order once, at the top of your entry CSS */
@layer reset, third-party, host-app, tour-kit.base, tour-kit.theme, utilities;
```

This single line establishes priority. `reset` has the lowest priority. `utilities` has the highest.

### Layered tour styles in practice

```css
/* tour-kit/styles.css */
@layer tour-kit.base {
  .tk-tooltip {
    position: absolute;
    background: var(--tk-bg, white);
    border-radius: var(--tk-radius, 8px);
    padding: var(--tk-padding, 16px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .tk-overlay {
    position: fixed;
    inset: 0;
    background: var(--tk-overlay-bg, rgba(0, 0, 0, 0.5));
  }
}
```

The host app can override any style without touching `!important`:

```css
@layer host-app {
  .tk-tooltip {
    border-radius: 12px;
    font-family: 'Inter', sans-serif;
  }
}
```

### The unlayered escape hatch

CSS written outside any `@layer` block beats all layered styles. This is the mechanism for tour overlay lockout, styles that must win unconditionally:

```css
/* Critical overlay styles — unlayered, wins everything */
.tk-overlay-lockout {
  position: fixed;
  inset: 0;
  z-index: 2147483647;
  pointer-events: all;
}
```

No `!important`. No specificity tricks.

## Tailwind CSS integration

Tailwind v3 and v4 both use `@layer` internally with the order `theme, base, components, utilities`. When you add a tour library alongside Tailwind, you have two integration approaches.

**Option A: Tour styles inside Tailwind's components layer**

```css
@layer components {
  @import '@tourkit/styles';
}
```

Any Tailwind utility class in your JSX overrides tour defaults. Simple, but your tour styles compete with every other `@layer components` rule.

**Option B: Tour styles as a named layer above components**

```css
@layer theme, base, components, tour-kit, utilities;
```

Tour Kit's defaults now beat component-level styles but lose to utility classes. This is the approach we recommend because it gives you predictable override behavior without requiring Tailwind `@apply` directives.

## Why shadow DOM isn't the answer for tour components

When developers hear "style isolation," shadow DOM comes up. But shadow DOM creates bidirectional isolation where styles can't leak in *or* out. That's the wrong model for product tours.

| Approach | Isolation type | Theming | Runtime cost | Tour library fit |
|---|---|---|---|---|
| Shadow DOM | Bidirectional (blocks in + out) | CSS custom properties only | Web Component overhead | Poor |
| CSS @layer | Priority ordering | Full cascade access | Zero (parse-time only) | Excellent |
| CSS isolation: isolate | Stacking context only | Full cascade access | Zero | Partial (z-index only) |

Shadow DOM breaks three things product tours need:

1. **Focus management.** Shadow DOM boundaries block `element.focus()` calls from reaching elements inside a shadow root.
2. **Event bubbling.** Keyboard events (Escape to dismiss, Tab to move) stop at the shadow boundary.
3. **Accessibility tree traversal.** A shadow root disrupts `aria-describedby` and `aria-labelledby` references between tour tooltips and highlighted elements.

CSS layers give you priority control without breaking any of these.

## Common mistakes to avoid

**Declaring layers in multiple files without a shared order.** Layer priority locks on first appearance. Always declare the full layer stack in a single entry file.

**Using `@import` without `layer()`.** A bare `@import 'library.css'` loads styles as unlayered, meaning they beat everything in your layer stack. Always wrap third-party imports: `@import 'library.css' layer(third-party)`.

**Forgetting `!important` reversal.** Inside `@layer`, `!important` declarations reverse the priority order. An `!important` rule in a low-priority layer beats `!important` in a high-priority layer.

**Assuming @layer fixes z-index.** Layers control cascade priority, while z-index controls paint order within stacking contexts. Different problems, different solutions.

## FAQ

### Do CSS cascade layers work with React 19?

CSS cascade layers are a browser-level feature processed at stylesheet parse time, independent of any JavaScript framework. The `@layer` declarations run in the browser's CSS engine before React renders a single component.

### What happens in browsers that don't support @layer?

In unsupported browsers (pre-2022), `@layer` declarations are ignored and styles fall back to normal cascade behavior based on specificity and source order. With approximately 96% global support as of April 2026, this affects less than 4% of users.

### Does @layer affect CSS performance?

Layer declarations are processed at stylesheet parse time with zero runtime overhead. The browser resolves layer priority once during parsing, not on every style recalculation. Bundle size impact is negligible.

---

Full article with all code examples and implementation details: [usertourkit.com/blog/css-layers-product-tour-styles](https://usertourkit.com/blog/css-layers-product-tour-styles)
