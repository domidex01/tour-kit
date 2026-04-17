# Is React Joyride still maintained in 2026?

### The library went silent for months. Competitors called it dead. Then V3 shipped.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/is-react-joyride-still-maintained)*

If you searched this question recently, you probably found conflicting answers. Multiple blog posts published in late 2025 and early 2026 declared React Joyride "discontinued" or "unmaintained." Those posts were written during a release gap between November 2024 and March 2026. They're now outdated.

Here's what actually happened.

## Yes, React Joyride is actively maintained

React Joyride received a ground-up V3 rewrite on March 23, 2026. As of April 2026, it has 673K weekly npm downloads, 7,687 GitHub stars, and only 3 open issues. Version 3.0.2 was published on April 1, 2026.

## The gap that caused confusion

React Joyride went silent between November 2024 and March 2026. During that window, React 19 shipped and broke V2. Automated health checkers flagged the project. Competitor blogs declared it dead.

Then V3 dropped — three releases in nine days. The maintainer had been quietly building a complete rewrite the entire time.

## What changed in V3

The rewrite is substantial: Floating UI replaced Popper.js for positioning, SVG overlays replaced CSS box-shadow for spotlighting, and a proper `useJoyride()` hook replaced the old `getHelpers` callback pattern. Bundle size dropped roughly 30%.

Most importantly, React 19 works. V2 relied on APIs that React 19 removed entirely.

## What's still not fixed

Being maintained doesn't mean being perfect. React Joyride V3 still renders with inline styles (painful for Tailwind teams), has touch device quirks requiring double-tap, and doesn't handle multiple instances on a single page well.

The bigger concern is sustainability. This is a solo-maintainer project with no co-maintainers, no corporate sponsor, and no visible revenue model. The four-month gap happened because one person was heads-down on a rewrite with no way to signal "still alive, just building."

## The bottom line

React Joyride is maintained. V3 is a genuine improvement. But "maintained" and "right for your project" are different questions. If you need full style control, run tours on mobile, or worry about solo-maintainer risk, it's worth evaluating alternatives.

Full article with comparison tables and decision framework: [usertourkit.com/blog/is-react-joyride-still-maintained](https://usertourkit.com/blog/is-react-joyride-still-maintained)

*Suggested Medium publications: JavaScript in Plain English, Better Programming, ITNEXT*
