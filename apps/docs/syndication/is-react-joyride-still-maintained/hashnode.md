---
title: "Is React Joyride still maintained in 2026?"
slug: "is-react-joyride-still-maintained"
canonical: https://usertourkit.com/blog/is-react-joyride-still-maintained
tags: react, javascript, web-development, open-source
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/is-react-joyride-still-maintained)*

# Is React Joyride still maintained in 2026?

If you searched this question, you probably found conflicting answers. Multiple blog posts published in late 2025 and early 2026 declared React Joyride "discontinued" or "unmaintained." Those posts were written during a release gap between November 2024 and March 2026. They're now outdated.

Here's what actually happened.

## Short answer: yes, React Joyride is actively maintained

React Joyride is maintained and received a ground-up V3 rewrite on March 23, 2026. As of April 2026, it has 673K weekly npm downloads, 7,687 GitHub stars, and only 3 open issues. Version 3.0.2 was published on April 1, 2026. The library supports React 16.8 through React 19, replaced Popper.js with Floating UI, and ships with a new hook-based API. It remains MIT-licensed and free.

## What happened during the "gap"

React Joyride went silent between November 2024 and March 2026, with no npm releases for roughly four months. During that window, React 19 shipped and broke V2, automated health checkers flagged the project, and competitor blogs declared it dead.

React 19 shipped. React Joyride V2 broke because it relied on `unmountComponentAtNode` and `unstable_renderSubtreeIntoContainer`, both removed in React 19.

Package health analyzers like Snyk flagged the library, suggesting it "could be considered as discontinued."

Then V3 dropped. Three releases in nine days. The maintainer, gilbarbara, had been quietly building a complete rewrite.

## What V3 actually changed

| Feature | V2 | V3 |
|---------|----|----|
| React 19 support | Broken | Full support (React 16.8-19) |
| Positioning engine | Popper.js / react-floater | @floating-ui/react-dom |
| Spotlight rendering | CSS box-shadow | SVG overlay (more precise) |
| API style | getHelpers callback | useJoyride() hook |
| Event system | Single callback | Discriminated event types |
| Async steps | Not supported | before/after hooks with loader support |
| Bundle size | ~498KB unpacked | ~30% smaller |

## Known issues that persist

- **Inline styles only** — forces overrides when using Tailwind/design token systems
- **Touch device quirks** — double-tap required on mobile
- **Multi-instance conflicts** — multiple Joyride instances on one page cause issues
- **Solo maintainer** — bus factor of 1, no co-maintainers or commercial backing

## How React Joyride compares to alternatives

| Library | Weekly downloads | React 19 | License | Approach |
|---------|-----------------|----------|---------|----------|
| React Joyride | 673K | Yes (V3) | MIT | Opinionated UI with component overrides |
| Shepherd.js | ~130K | React wrapper has issues | Commercial license | Framework-agnostic |
| Driver.js | Lower | Framework-agnostic | MIT | Vanilla JS, smallest bundle |
| User Tour Kit | New | Yes | MIT (core) / Pro | Headless, composable packages |

**Bias disclosure:** We built User Tour Kit, so take this table with appropriate skepticism.

Full article: [usertourkit.com/blog/is-react-joyride-still-maintained](https://usertourkit.com/blog/is-react-joyride-still-maintained)
