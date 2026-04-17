*Originally published at [usertourkit.com](https://usertourkit.com/blog/what-is-spotlight-overlay)*

# What Is a Spotlight Overlay? Element Highlighting Explained

A spotlight overlay is a full-screen semi-transparent layer with a transparent cutout positioned over a target UI element. The pattern appears in product tours, onboarding flows, and feature announcements across web and mobile applications. This article breaks down how it works, the CSS techniques behind it, and the accessibility requirements most implementations miss.

## Definition

A spotlight overlay dims the background to draw the user's eye to a specific control or section. Atlassian's design system defines it as a component that "introduces users to points of interest, from focused messages to multi-step tours." Unlike a modal dialog, the spotlight overlay lets the user see and interact with the highlighted element in its original context.

## CSS Implementation Techniques

Three approaches create the transparent cutout:

| Technique | Shapes Supported | Blocks Background Interaction | Complexity |
|---|---|---|---|
| `box-shadow` on target | Rectangle only | No (visual-only) | ~5 lines CSS |
| `clip-path` with evenodd fill | Any shape (rounded, custom) | Yes (true overlay layer) | ~30 lines JS + CSS |
| SVG `<clipPath>` | Arbitrary (circle, polygon) | Yes | ~50 lines JS + SVG |

Most tour libraries use `clip-path`. Two path regions are defined (full viewport + target rectangle), then `fill-rule: evenodd` makes the overlap transparent.

A fourth technique, `mix-blend-mode`, creates a visual effect but does not block pointer events beneath the overlay — making it unsuitable for interactive product tours.

## Business Impact

Research from Plotline (April 2026) indicates 70% of application features go undiscovered without active user guidance. Strategic spotlight implementations improve feature adoption by 40-60%.

## Accessibility Requirements

Spotlight overlays must meet WCAG 2.2 SC 2.4.11 (Focus Not Obscured):

- `role="dialog"` and `aria-modal="true"`
- Focus trap within tooltip controls
- Escape key dismissal
- Focus restoration to trigger element on close
- `prefers-reduced-motion` support

---

Full article with React code examples: [usertourkit.com/blog/what-is-spotlight-overlay](https://usertourkit.com/blog/what-is-spotlight-overlay)
