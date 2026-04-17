## Subreddit: r/reactjs

**Title:** Built accessible hotspot components with keyboard dismiss and prefers-reduced-motion — here's the approach

**Body:**

I've been working on a hints/hotspot system for React and ran into a gap in every tutorial I found: none of them handle WCAG 1.4.13 properly. That spec requires hover/focus content to be dismissable (Escape key), hoverable (pointer can move into the tooltip), and persistent (stays until user acts). Most hotspot examples use CSS-only pulsing dots with no keyboard support at all.

The approach I landed on: each hotspot renders as a focusable `<button>` with `aria-expanded`, tooltips use Floating UI for positioning (flip, shift, offset middleware), and dismiss is handled through `useDismiss` from @floating-ui/react. State management is a React reducer that tracks open/dismissed per hint independently — only one tooltip open at a time.

Bundle impact is under 10KB gzipped for the two packages (@tour-kit/core + @tour-kit/hints). The pulse animation CSS respects `prefers-reduced-motion` with a media query that disables it automatically.

One thing I wish I'd done earlier: using React refs instead of CSS selectors for dynamically rendered elements. Selectors work fine for static content, but anything inside a modal or lazy-loaded route needs a ref to avoid timing issues.

Full writeup with code examples, a comparison table (Tour Kit vs React Joyride beacon vs CSS-only), and troubleshooting: https://usertourkit.com/blog/react-hotspot-component

Happy to answer questions about the positioning logic or accessibility patterns.
