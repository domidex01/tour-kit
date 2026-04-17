## Title: Building an accessible spotlight overlay in React with CSS clip-path

## URL: https://usertourkit.com/blog/react-spotlight-highlight-component

## Comment to post immediately after:

Most React spotlight tutorials use mix-blend-mode: hard-light for the dimming effect, which breaks in dark mode and with brand-colored backdrops (React Joyride has dozens of open issues about this).

This walkthrough builds one from scratch using CSS clip-path: polygon() to cut a rectangular hole in a full-viewport overlay. The approach is GPU-accelerated, dark-mode safe, and adds zero bytes to the bundle.

The article also covers accessibility patterns that existing tutorials skip: inert attribute for background content, focus trapping, Escape key dismissal, and prefers-reduced-motion gating. As of April 2026, React Joyride (~400K weekly downloads) and Shepherd.js aren't React 19 compatible, so this is relevant for teams upgrading.

Includes a comparison table of all the approaches (clip-path, mix-blend-mode, box-shadow, SVG mask, canvas) with specific tradeoffs for each.
