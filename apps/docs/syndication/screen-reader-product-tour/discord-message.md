## Channel: #articles or #a11y in Reactiflux

**Message:**

Wrote a tutorial on making product tours work with screen readers in React. Covers three patterns: ARIA live regions (with a timing trick NVDA needs), focus trapping with restore, and the `inert` attribute for background suppression.

Includes a comparison table testing SR behavior across React Joyride, Shepherd, Driver.js, Intro.js, and Tour Kit.

https://usertourkit.com/blog/screen-reader-product-tour

Curious if anyone has experience testing product tours with JAWS specifically — it applies heuristics that mask missing ARIA attributes, which makes me wonder how many tours "work" in JAWS but fail in NVDA.
