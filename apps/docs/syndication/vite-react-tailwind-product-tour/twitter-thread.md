## Thread (6 tweets)

**1/** Most React product tour libraries inject their own CSS. That's fine until your app runs Tailwind and every tooltip override becomes an `!important` war.

I wrote a tutorial on adding tours to a Vite + React + Tailwind stack without touching a single CSS override. Thread below.

**2/** The core problem: React Joyride (~37KB) uses inline styles. React Tour requires styled-components. Neither plays well with utility-first CSS.

Tour Kit is headless — it gives you tour logic, you write the tooltip as a regular React component with Tailwind classes. ~6KB gzipped.

**3/** The part nobody talks about: accessibility.

Smashing Magazine's popular React product tour guide doesn't mention it once. CSS-Tricks' onboarding UI experiment admits it's "far from perfect" for a11y.

Tour Kit ships WCAG 2.1 AA by default: keyboard nav, focus trapping, screen reader announcements.

**4/** Vite-specific wins:
- ESM-first, so zero config changes
- Tree-shakes down to ~5.8KB in production
- HMR works — edit your tooltip, see it update in <80ms without losing tour state
- No pre-bundling config needed

**5/** Quick comparison table:

Tour Kit: ~6KB, headless, WCAG 2.1 AA, tree-shakeable
Joyride: ~37KB, inline styles, partial a11y
React Tour: ~12KB + styled-components, no a11y
Driver.js: ~5KB, own CSS, partial a11y

**6/** Full tutorial with 5 implementation steps, code examples, troubleshooting, and comparison table:

https://usertourkit.com/blog/vite-react-tailwind-product-tour

Honest limitation: no visual builder. Steps are defined in code. If your team writes React + Tailwind, that's a feature, not a bug.
