# How to Build a Spotlight Overlay in React That Actually Works in Dark Mode

## Most tutorials teach the wrong CSS technique. Here's the fix.

*Originally published at [usertourkit.com](https://usertourkit.com/blog/react-spotlight-highlight-component)*

You need to draw a user's attention to a specific element on the page. Maybe it's a new feature they haven't tried, a form field they skipped, or the next step in an onboarding flow. The standard approach is a spotlight overlay: dim everything except the target element, then show a tooltip explaining what to do.

Most React tutorials teach this with `mix-blend-mode: hard-light`. That technique breaks in dark mode and with brand-colored backdrops. As of April 2026, React Joyride (~400K weekly npm downloads) and Shepherd.js (~30K weekly downloads) aren't compatible with React 19 either, so developers are building custom solutions right now.

This tutorial builds an accessible spotlight overlay from scratch using CSS `clip-path`, React portals, and proper ARIA attributes. The result works in dark mode, handles dynamic layouts, and meets WCAG 2.1 AA requirements.

The key insight: instead of using `mix-blend-mode` (which interacts unpredictably with your page's color scheme), draw a `clip-path: polygon(...)` that covers the entire viewport with a rectangular hole cut out around the target element. GPU-accelerated, dark-mode safe, zero bundle size impact since it's native CSS.

The full tutorial covers five steps:
1. Measuring the target element with `getBoundingClientRect` + `ResizeObserver`
2. Rendering through a React portal to avoid z-index conflicts
3. Focus trapping and keyboard accessibility (WCAG 2.1 AA)
4. Respecting `prefers-reduced-motion`
5. Extracting a reusable `useSpotlight` hook

Read the full article with all code examples: [usertourkit.com/blog/react-spotlight-highlight-component](https://usertourkit.com/blog/react-spotlight-highlight-component)

*Suggest submitting to: JavaScript in Plain English, Bits and Pieces, Better Programming*
