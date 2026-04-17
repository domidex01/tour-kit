## Subject: Element highlighting techniques: box-shadow, SVG cutout, or canvas?

## Recipients:
- Cooperpress (React Status, JavaScript Weekly, Frontend Focus): editor@cooperpress.com
- This Week in React: sebastien@thisweekinreact.com
- Bytes.dev: submit via site
- Frontend Focus fits best given the CSS/SVG/Canvas technical content

## Email body:

Hi [name],

I wrote a deep-dive comparing three element highlighting approaches for product tours: CSS box-shadow (the classic 9999px spread hack), SVG overlay with cutout, and HTML5 canvas. The article traces why Driver.js and React Joyride both independently migrated from box-shadow to SVG — stacking context bugs drove both rewrites.

Includes implementation code for all three techniques, a comparison table covering 11 criteria (performance, accessibility, multi-element support), and common mistakes. No published fps benchmarks exist for these techniques, so I ran my own in Chrome DevTools: 8-12ms paint per frame for box-shadow vs under 1ms for SVG path updates.

Link: https://usertourkit.com/blog/element-highlighting-techniques-box-shadow-svg-canvas

Thanks,
Domi
