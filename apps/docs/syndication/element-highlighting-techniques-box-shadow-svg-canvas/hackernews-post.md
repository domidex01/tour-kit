## Title: How product tour libraries implement element highlighting: box-shadow vs SVG cutout vs Canvas

## URL: https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas

## Comment to post immediately after:

I wrote this after building a highlighting system for a tour library and realizing there's no good comparison of the three dominant approaches.

The interesting finding: both Driver.js and React Joyride independently migrated from CSS box-shadow (the classic `0 0 0 9999px` spread hack) to SVG overlays with `fill-rule: evenodd` path subtraction. The motivation was identical — stacking contexts. When a highlighted element sits inside a parent with `transform` or `filter`, the z-index isolation breaks the overlay. React Joyride had 15+ GitHub issues about this specific bug.

Performance-wise, box-shadow triggers CPU-bound paint operations at 8-12ms per frame on mid-range devices. SVG path updates stay under 1ms because browsers composite SVG on the GPU layer. Canvas gives you arbitrary shapes but requires a full redraw per step transition.

The article also covers accessibility requirements (SVG overlays must be `aria-hidden`), mix-blend-mode as an alternative (same stacking context problem), and why the Popover API solves tooltips but not spotlights.

One gap I couldn't fill: there are no published head-to-head fps benchmarks for these techniques. If anyone has done this work, I'd like to link to it.
