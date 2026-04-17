## Channel: #articles or #show-off in Reactiflux

**Message:**

I wrote a deep-dive on how product tour libraries implement their spotlight/overlay effect — comparing box-shadow, SVG cutout, and canvas approaches. The interesting part: both Driver.js and React Joyride migrated from box-shadow to SVG because of stacking context bugs. Includes implementation code for all three and a comparison table.

https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas

Curious if anyone's tried combining the Popover API with SVG overlays for tours — seems like the next evolution but I haven't seen it shipped anywhere.
