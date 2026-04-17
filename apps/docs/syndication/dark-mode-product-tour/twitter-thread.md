## Thread (6 tweets)

**1/** Dark mode breaks product tours in ways most devs don't expect.

Overlays vanish. Tooltips go flat. Accent colors vibrate.

Here's what actually goes wrong and how to fix it with CSS variables:

**2/** Problem 1: your spotlight overlay uses rgba(0,0,0,0.5).

On a dark background, that's nearly invisible. The whole "look here" effect disappears.

Fix: bump dark-mode overlay to 0.75 opacity via a CSS variable override.

**3/** Problem 2: tooltips lose elevation.

In dark mode, floating surfaces need to be LIGHTER than the page (Steve Schoger's principle). Same-shade tooltips look flat.

Use #1e1e2e for the page, #2d2d3f for the tooltip. Never pure black.

**4/** Problem 3: saturated accent colors vibrate on dark backgrounds.

#0033cc looks clean on white. On #1e1e2e it bleeds.

Fix: desaturate via HSL. hsl(220, 100%, 40%) → hsl(220, 60%, 75%)

**5/** The whole approach: define tour colors as CSS custom properties on :root, override in [data-theme='dark'].

One selector. Zero React re-renders. Works with Tailwind dark: too.

Don't forget: WCAG 4.5:1 contrast applies to dark mode. No exceptions.

**6/** Full tutorial with complete CSS variables, a useTourTheme hook (light/dark/system), contrast ratio table, and fixes for the flash-of-light-theme problem:

https://usertourkit.com/blog/dark-mode-product-tour
