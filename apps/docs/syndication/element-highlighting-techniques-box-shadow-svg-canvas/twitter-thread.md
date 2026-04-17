## Thread (6 tweets)

**1/** Both Driver.js and React Joyride quietly migrated from CSS box-shadow to SVG overlays for their spotlight effect. Why? Stacking contexts broke everything.

Here's the technical breakdown of three element highlighting approaches for product tours:

**2/** The original technique: `box-shadow: 0 0 0 9999px rgba(0,0,0,0.5)`. Elegant — zero extra DOM. But if the element sits in a parent with `transform` or `filter`, the z-index isolation breaks.

React Joyride has 15+ GitHub issues about this.

**3/** The fix every library converged on: SVG overlay with `fill-rule: evenodd` path subtraction.

Draw a full-viewport SVG at document root, punch a hole at `getBoundingClientRect()` coordinates. Lives outside every stacking context. GPU-composited.

**4/** Performance matters:
- Box-shadow: 8-12ms paint per frame (CPU-bound)
- SVG path update: <1ms (GPU-composited)
- Canvas: flexible but 80-120 lines vs 30-40 for SVG

The 4ms frame budget for 60fps doesn't forgive box-shadow on mobile.

**5/** Common mistakes that break tours:
- Forgetting `pointer-events: none` on overlay
- Skipping `aria-hidden="true"` (screen readers read SVG path coordinates)
- Using `position: absolute` instead of `fixed`
- Not scaling canvas for devicePixelRatio

**6/** Full breakdown with implementation code for all three techniques, 11-criteria comparison table, and accessibility requirements:

https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas
