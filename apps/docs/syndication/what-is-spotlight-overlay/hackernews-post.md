## Title: Spotlight overlays: how clip-path, box-shadow, and mix-blend-mode compare for element highlighting

## URL: https://usertourkit.com/blog/what-is-spotlight-overlay

## Comment to post immediately after:

This is a glossary-style breakdown of the spotlight overlay pattern — the dimmed background with a transparent cutout that product tours use to guide users through an interface.

The comparison between CSS techniques turned out to be the most interesting part. box-shadow is trivial but doesn't block interaction. clip-path with evenodd fill-rule is what most libraries use and handles rounded cutouts well. mix-blend-mode looks good visually but doesn't block pointer events, which is why React Joyride's GitHub has persistent dark-mode spotlight bugs.

On the accessibility side, WCAG 2.2 added SC 2.4.11 (Focus Not Obscured) which is directly relevant — the highlighted element must remain visible when focused. Most implementations miss the focus trap and focus restoration requirements.

Data point from Plotline's research: 70% of app features go undiscovered without active guidance, and strategic spotlight implementations improve adoption by 40-60%.
