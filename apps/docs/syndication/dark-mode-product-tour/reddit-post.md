## Subreddit: r/reactjs

**Title:** How I handle dark mode theming for product tour overlays and tooltips

**Body:**

I've been working on product tour components and ran into a surprisingly tricky problem: dark mode breaks tours in ways that regular component theming doesn't.

The core issue is that product tours layer transparent overlays, floating tooltips, and accent-colored buttons on top of your existing UI simultaneously. Three specific things go wrong in dark mode:

1. **Spotlight overlays disappear.** The standard `rgba(0, 0, 0, 0.5)` backdrop is nearly invisible on dark backgrounds. You need to bump the opacity to 0.7+ for dark themes.

2. **Tooltips lose elevation.** In dark mode, floating surfaces need to be *lighter* than the page background (Steve Schoger's elevation principle), but most implementations render them at the same shade. Fix: use `#1e1e2e` for the page and `#2d2d3f` for elevated surfaces. Avoid pure black `#000000` — it causes halo effects around text.

3. **Saturated accent colors vibrate.** A `#0033cc` button that looks clean on white will visually bleed on dark surfaces. Desaturate to `#809fff` (same hue, lower saturation via HSL).

The approach that worked for me: define the entire tour color palette as CSS custom properties on `:root`, then override them in a `[data-theme='dark']` selector. The tooltip component references variables like `var(--tour-bg)` instead of hardcoded colors. When the user toggles themes, the browser repaints at the CSS layer — no React re-renders, no conditional className logic.

For system preference detection, a hook that reads `prefers-color-scheme` and supports three states (light/dark/system) covers most cases.

One thing I almost missed: WCAG 2.1 requires 4.5:1 contrast for normal text in dark mode too. There's no exception just because dark mode is "optional." Check every text-on-surface combination — your accent color might pass on the primary background but fail on a secondary surface.

I wrote up the full implementation with all the CSS variable definitions, a `useTourTheme` hook, contrast ratio table, and troubleshooting for the flash-of-light-theme problem: https://usertourkit.com/blog/dark-mode-product-tour

Happy to answer questions about any of the patterns.
