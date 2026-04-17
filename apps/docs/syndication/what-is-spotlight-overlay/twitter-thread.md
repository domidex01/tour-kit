## Thread (6 tweets)

**1/** 70% of app features go undiscovered without active guidance.

That's why every product tour uses spotlight overlays — the dimmed background with a transparent cutout. But the CSS technique you pick matters more than you think.

**2/** Three ways to cut the hole:

box-shadow: 5 lines of CSS. Rectangle only. Doesn't block clicks.

clip-path + evenodd: 30 lines. Any shape. Actually blocks the background. This is what most libraries use.

SVG clipPath: Most flexible. More verbose.

**3/** The trap: mix-blend-mode.

Looks great visually. Doesn't block pointer events beneath the overlay. React Joyride used this historically — that's why their GitHub has dozens of dark mode spotlight bugs.

**4/** The accessibility part most people miss:

Spotlight overlays need role="dialog", aria-modal="true", focus trapping, Escape to dismiss, and focus restoration on close.

WCAG 2.2 SC 2.4.11 (Focus Not Obscured) is specifically about this.

**5/** 2026 trend: behavior-triggered spotlights.

Show the highlight when a user first encounters a feature, not on every page load. Generic page-load tours annoy returning users. Plotline data shows strategic spotlights improve adoption by 40-60%.

**6/** Full breakdown with a React clip-path code example and comparison table:

https://usertourkit.com/blog/what-is-spotlight-overlay
