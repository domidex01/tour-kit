## Thread (6 tweets)

**1/** Most React spotlight tutorials use mix-blend-mode: hard-light for the dimming effect.

It breaks in dark mode. It breaks with brand colors. React Joyride has dozens of open issues about this.

Here's how to build one that actually works: 🧵

**2/** The fix: CSS clip-path: polygon()

Draw a full-viewport overlay with a rectangular hole cut out around the target element. GPU-accelerated, dark-mode safe, 0KB bundle impact (native CSS).

No color blending, no interaction with your page's color scheme.

**3/** The thing every tutorial skips: accessibility.

Your spotlight overlay is a modal. It needs:
- role="dialog" + aria-modal
- Focus trapping (Tab + Shift+Tab)
- Escape to dismiss
- inert on background content

Zero existing tutorials cover all four.

**4/** Another gap: prefers-reduced-motion.

When users opt out of animation, your spotlight position transitions should snap instantly, not animate. This is a WCAG 2.3.3 requirement.

One CSS media query. Every tutorial misses it.

**5/** And render through a React portal.

If your overlay is inside a parent with overflow: hidden, transform, or will-change, it creates a stacking context. Your overlay gets clipped.

Portal into document.body. Problem gone.

**6/** Full tutorial with all the code (useElementRect, useSpotlightA11y, useReducedMotion, useSpotlight hooks) + a comparison table of clip-path vs mix-blend-mode vs box-shadow vs SVG mask:

https://usertourkit.com/blog/react-spotlight-highlight-component
