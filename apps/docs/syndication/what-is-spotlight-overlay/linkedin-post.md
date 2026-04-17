70% of app features go undiscovered without active guidance.

That's why spotlight overlays — the dimmed background with a transparent cutout — show up in almost every product tour. Notion, Figma, Slack all use them.

But the CSS technique behind the cutout matters. box-shadow is trivial but doesn't block background clicks. clip-path with evenodd fill is what most tour libraries use. And mix-blend-mode looks great but breaks in dark mode (React Joyride learned this the hard way).

The accessibility side is where most implementations fall short. WCAG 2.2 added a criterion specifically about this: Focus Not Obscured (SC 2.4.11). Your spotlight needs role="dialog", focus trapping, Escape to dismiss, and focus restoration on close.

I wrote a glossary-style breakdown covering the three CSS techniques, a React code example, and the accessibility requirements: https://usertourkit.com/blog/what-is-spotlight-overlay

#react #javascript #accessibility #webdevelopment #uxdesign #opensource
