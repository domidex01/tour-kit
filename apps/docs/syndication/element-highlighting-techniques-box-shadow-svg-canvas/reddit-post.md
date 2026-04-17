## Subreddit: r/reactjs

**Title:** I dug into how Driver.js, React Joyride, and Shepherd.js implement their spotlight overlays — here's what I found

**Body:**

I was building a highlighting system for a product tour library and wanted to understand why the major libraries made their technical choices. Turns out there's an interesting migration story.

Both Driver.js and React Joyride originally used the `box-shadow: 0 0 0 9999px rgba(0,0,0,0.5)` hack to create the dark overlay behind the spotlighted element. It's elegant — zero extra DOM nodes, pure CSS. But it breaks when the target element sits inside a parent with `transform`, `filter`, or `will-change` because the browser creates an isolated stacking context that traps the z-index.

React Joyride has 15+ GitHub issues about this. Driver.js rewrote their overlay to use SVG with `fill-rule: evenodd` path subtraction — basically drawing a full-viewport SVG at document.body and punching a hole at the target coordinates. React Joyride v3 made the same switch. Shepherd.js went further and added `extraHighlights` for multiple simultaneous cutouts.

The performance difference is real: box-shadow triggers CPU-bound paint at 8-12ms per frame on mid-range Android. SVG path updates stay under 1ms because they're GPU-composited. Canvas is technically possible (and gives you arbitrary shapes) but requires 80-120 lines of JS vs 30-40 for SVG, plus manual devicePixelRatio handling for Retina.

I wrote up the full breakdown with implementation code for all three techniques, a comparison table, accessibility requirements (the SVG must be `aria-hidden`), and common mistakes.

Full article with code examples: https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas

Curious if anyone's experimented with combining the Popover API (for tooltip z-index) with SVG overlays (for the spotlight). Seems like the logical next step but I haven't seen it in the wild.
