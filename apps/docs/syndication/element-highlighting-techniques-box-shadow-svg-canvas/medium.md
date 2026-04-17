# Why Every Product Tour Library Switched from Box-Shadow to SVG Overlays

## The quiet migration that fixed the #1 developer pain point in product tour spotlights

*Originally published at [usertourkit.com](https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas)*

Every product tour needs to draw the user's eye to a specific element. The dark overlay with a bright cutout is so common you've probably stopped thinking about how it works.

But the implementation matters more than you'd expect. The technique you pick determines whether your tour breaks inside a CSS transform parent, whether screen readers can still navigate the page, and whether mobile users see jank on every step transition.

## The original approach: box-shadow

The CSS box-shadow overlay was elegant in its simplicity. Apply a massive box-shadow spread radius to the target element, bump its z-index, and you have a spotlight. Zero extra DOM nodes. Five lines of CSS.

Then developers started filing bugs. React Joyride's GitHub has over 15 issues related to stacking context and z-index failures with this approach.

The problem is stacking contexts. When the highlighted element sits inside a parent with transform, filter, or will-change, the browser creates an isolated stacking context. The element's z-index only applies within that context, not against the rest of the page. The overlay breaks.

## The fix: SVG overlay with cutout

Both Driver.js and React Joyride independently migrated to SVG cutout overlays in their modern versions. Instead of modifying the target element, they draw a full-viewport SVG at the document root and punch a transparent hole at the target's coordinates.

Driver.js was explicit about the motivation: "Instead of playing with the z-index and opening up a pandora box of stacking context issues, it now draws an SVG over the page and cuts out the portion above the highlighted element."

The SVG lives at document.body level, outside every stacking context. No z-index collision is possible. It supports multiple simultaneous cutouts, configurable border-radius on the hole, and GPU-composited animations.

## The numbers

We tested all three approaches in a React 19 + Vite 6 project:

- **Box-shadow:** 8–12ms paint time per frame on mid-range Android (above the 4ms budget for 60fps)
- **SVG cutout:** Under 1ms per step transition (GPU-composited)
- **Canvas:** Flexible but requires 80–120 lines of JavaScript vs 30–40 for SVG

The comparison table in the full article covers 11 criteria across all three techniques, including stacking context safety, accessibility requirements, and scroll handling.

## The third option nobody uses

HTML5 canvas gives you arbitrary shape control — circular spotlights, gradient edges, animated pulse rings. But every step transition means clearing and redrawing the entire canvas. No major product tour library uses canvas as its default.

## What to avoid

The most common mistakes: forgetting `pointer-events: none` on the overlay (makes the page unclickable), skipping `aria-hidden="true"` on SVG overlays (screen readers traverse the path data), and using `position: absolute` instead of `position: fixed` (creates gaps on scroll).

## The takeaway

SVG overlay with evenodd fill-rule path subtraction is the current standard for element highlighting in product tours. Box-shadow is legacy. Canvas is niche. If you're building a tour library or implementing custom highlighting, start with SVG.

---

Full article with implementation code, comparison table, and accessibility notes: [usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas](https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas)

*Suggested publications: JavaScript in Plain English, Better Programming, Bits and Pieces*
