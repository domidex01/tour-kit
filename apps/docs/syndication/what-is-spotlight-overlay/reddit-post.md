## Subreddit: r/reactjs

**Title:** The three CSS techniques behind spotlight overlays (and why clip-path wins)

**Body:**

I wrote up a glossary-style breakdown of spotlight overlays — the dimmed background + transparent cutout pattern that almost every product tour uses.

The interesting part is comparing the three CSS approaches:

- **box-shadow**: Dead simple (5 lines), but rectangle-only and doesn't actually block clicks on the background. It's visual-only.
- **clip-path with evenodd**: What most tour libraries use. You define two path regions and the overlap becomes transparent. Supports rounded corners and actually blocks interaction. ~30 lines of JS + CSS.
- **SVG clipPath**: Most flexible for arbitrary shapes, but more verbose.
- **mix-blend-mode**: The trap. Looks great visually but doesn't block pointer events. React Joyride used this historically, which is why their GitHub has dozens of dark-mode spotlight bugs.

Other things covered: accessibility requirements (WCAG 2.2 SC 2.4.11 — focus not obscured), the `getBoundingClientRect()` + `ResizeObserver` positioning pattern, and why behavior-triggered spotlights outperform page-load ones.

Plotline's data says 70% of app features go undiscovered without active guidance, and strategic spotlights improve adoption by 40-60%.

Full article with a React code example: https://usertourkit.com/blog/what-is-spotlight-overlay

Curious if anyone has opinions on clip-path vs SVG clipPath for more complex cutout shapes.
