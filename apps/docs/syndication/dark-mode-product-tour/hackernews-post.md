## Title: Dark mode breaks product tour overlays – CSS variable fix for React

## URL: https://usertourkit.com/blog/dark-mode-product-tour

## Comment to post immediately after:

Product tours stack transparent overlays, floating tooltips, and accent-colored controls on top of your existing UI. In dark mode, three things break that don't break in regular component theming:

1. Semi-transparent black overlays (rgba(0,0,0,0.5)) become invisible on dark backgrounds. You need 0.7+ opacity for dark themes.
2. Tooltips at the same shade as the page lose elevation. Dark mode surfaces need lighter shades for closer elements (Steve Schoger's principle).
3. Saturated accent colors vibrate on dark surfaces. HSL desaturation fixes this.

The approach: define tour colors as CSS custom properties, override in a [data-theme='dark'] selector. The tooltip component references var(--tour-bg) instead of hardcoded values. Theme switches happen at the CSS layer with zero React re-renders.

One thing worth noting: WCAG 2.1 SC 1.4.3 requires 4.5:1 contrast for normal text regardless of whether dark mode is optional. We verified every pairing passes AA in both themes, but found a gotcha where the accent color passed on the primary background but failed on a secondary surface (4.1:1 vs the 4.5:1 minimum).

The article includes the full CSS variable setup, a useTourTheme hook with three-state toggle (light/dark/system), a contrast ratio verification table, and a fix for the flash-of-incorrect-theme problem.

Built with Tour Kit (headless React tour library, requires React 18+, no visual builder).
