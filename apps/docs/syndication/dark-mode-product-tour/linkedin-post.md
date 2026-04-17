Your product tour looks great in light mode. Have you checked dark mode?

Most tour libraries ship light-theme-only styles. When your app toggles to dark mode, three things break: the spotlight overlay becomes invisible (rgba(0,0,0,0.5) on a dark background does nothing), tooltips lose their visual elevation, and saturated accent colors vibrate against dark surfaces.

70% of developers default to dark mode. If your onboarding tour looks broken there, you're making a poor first impression on the majority of technical users.

The fix is simpler than you'd expect: CSS custom properties with adaptive overlay opacity, elevated tooltip surfaces (#1e1e2e page, #2d2d3f tooltips), and desaturated accent colors. One selector override handles the switch. Zero conditional rendering in React.

One thing teams miss: WCAG 2.1 requires 4.5:1 contrast ratios regardless of whether dark mode is "optional." No exceptions.

Full tutorial with working TypeScript code and a contrast verification table: https://usertourkit.com/blog/dark-mode-product-tour

#react #darkmode #webdevelopment #accessibility #ux #productdesign
