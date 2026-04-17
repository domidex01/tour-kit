## Thread (6 tweets)

**1/** Most product tour libraries ship 15-25KB of their own CSS. Then you spend hours overriding it to match your Tailwind design system.

There's a better way with Tailwind v4's @theme directive.

**2/** The trick: define tour-specific tokens in @theme.

--tour-tooltip-bg, --tour-beacon-color, --tour-enter-duration

Every @theme value becomes BOTH a CSS variable AND a Tailwind utility class. One declaration, two access patterns.

**3/** Motion tokens are the underrated part.

Define a duration scale (100ms / 200ms / 300ms / 500ms), then collapse everything to 0ms for prefers-reduced-motion with ONE media query.

7 CSS variable overrides. No JavaScript.

**4/** My favorite pattern: ARIA-tied beacon visibility.

Use Tailwind's aria-expanded: variant to control show/hide. If a dev forgets the ARIA attribute, the beacon looks broken.

A visual bug that catches an a11y gap. Accessibility by design, not by audit.

**5/** Multi-brand theming is trivial:

[data-brand="acme"] {
  --tour-beacon-color: oklch(0.65 0.2 145);
}

Add the data attribute to your root. The entire tour re-themes via CSS cascade. No props, no context.

**6/** Full tutorial with TypeScript code, troubleshooting, and FAQ:

https://usertourkit.com/blog/tailwind-product-tour-styling-design-tokens

Built with Tour Kit (headless, ships zero CSS, <8KB gzipped core).
