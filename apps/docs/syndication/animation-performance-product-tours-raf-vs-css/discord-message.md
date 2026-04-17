## Channel: #articles in Reactiflux

**Message:**

Wrote a deep-dive on animation performance in product tours — specifically when to use CSS transitions vs requestAnimationFrame vs the Web Animations API for tooltip positioning and step transitions. Found some interesting stuff around implicit compositing (where a high z-index tooltip silently promotes a bunch of host-app elements to GPU layers). Includes code examples and a prefers-reduced-motion reference table.

https://usertourkit.com/blog/animation-performance-product-tours-raf-vs-css

Curious if anyone else has run into the CSS variable spotlight antipattern — updating `--spotlight-x`/`--spotlight-y` per frame and getting style recalc jank.
