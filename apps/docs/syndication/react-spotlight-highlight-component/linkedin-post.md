Most React spotlight overlay tutorials teach the wrong CSS technique.

They use mix-blend-mode: hard-light, which breaks in dark mode and with branded backgrounds. React Joyride (400K weekly npm downloads) has dozens of open issues about this exact problem.

The fix is CSS clip-path: polygon(). You draw a full-viewport overlay with a rectangular hole cut out around the target element. GPU-accelerated, dark-mode safe, zero bundle size impact.

I wrote a tutorial covering the full implementation: element measurement with ResizeObserver, React portal rendering to avoid z-index traps, WCAG 2.1 AA keyboard accessibility, and prefers-reduced-motion support.

The accessibility angle is what makes this different. No existing tutorial covers all four requirements for a modal-like overlay: role="dialog", focus trapping, Escape key dismissal, and the inert attribute for background content.

With React Joyride and Shepherd.js not yet compatible with React 19 as of April 2026, this is especially relevant for teams upgrading their stack.

Full tutorial with TypeScript code: https://usertourkit.com/blog/react-spotlight-highlight-component

#react #javascript #webdevelopment #accessibility #frontend
