---
title: "Element highlighting techniques: box-shadow, SVG cutout, or canvas?"
slug: "element-highlighting-techniques-box-shadow-svg-canvas"
canonical: https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas
tags: react, javascript, web-development, css, svg
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas)*

# Element highlighting techniques: box-shadow, SVG cutout, or canvas?

Every product tour needs to draw the user's eye to a specific element. The dark overlay with a bright cutout is so common you've probably stopped thinking about how it works.

But the implementation matters. The technique you pick determines whether your tour breaks inside a CSS `transform` parent, whether screen readers can still navigate the page, and whether mobile users see jank on every step transition.

We built Tour Kit's highlighting system after testing all three major approaches. Here's what we found, what the other libraries chose, and why the industry quietly migrated from one technique to another.

## The great migration: box-shadow to SVG

The CSS box-shadow overlay was the original product tour highlighting technique. Apply `box-shadow: 0 0 0 9999px rgba(0,0,0,0.5)` to the target element, bump its `z-index`, and you have a spotlight. Zero extra DOM nodes.

Then developers started filing bugs. React Joyride's GitHub has 15+ issues related to stacking context and z-index failures.

The problem: when the highlighted element sits inside a parent with `transform`, `filter`, or `will-change`, the browser creates an isolated stacking context. The element's `z-index: 9999` only applies within that context, not against the rest of the page.

Driver.js called this out directly: "Instead of playing with the z-index and opening up a pandora box of stacking context issues, it now draws an SVG over the page and cuts out the portion above the highlighted element" ([Driver.js docs](https://driverjs.com/docs/simple-highlight)).

React Joyride made the same move in v3.

## Three techniques compared

| Criteria | CSS box-shadow | SVG cutout | HTML5 canvas |
|---|---|---|---|
| Extra DOM nodes | 0 | 1 | 1 |
| Stacking context safe | No | Yes | Yes |
| GPU compositable | No (paint-bound) | Yes | Partial |
| Multiple cutouts | No | Yes | Yes |
| Animation cost per step | Paint (CPU, 8-12ms) | Path update (<1ms) | Full redraw |
| Implementation complexity | Low (5 lines CSS) | Medium (30-40 lines) | High (80-120 lines) |
| Used by major libraries | Joyride v1-v2 (legacy) | Driver.js, Joyride v3, Shepherd | None |

SVG overlay with `fill-rule: evenodd` path subtraction is now the standard approach for production product tours. It lives at document root, immune to stacking context traps, supports multiple simultaneous cutouts, and transitions between steps in under 1ms.

## Common mistakes

- Forgetting `pointer-events: none` on the overlay
- Skipping `aria-hidden="true"` (screen readers will traverse SVG path data)
- Using `position: absolute` instead of `position: fixed`
- Animating box-shadow spread values (8-12ms paint per frame vs 4ms budget for 60fps)
- Not handling `devicePixelRatio` for canvas on Retina displays

Full article with implementation code for all three techniques, performance comparison table, and accessibility requirements:

[usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas](https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas)
