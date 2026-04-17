---
title: "Is React Joyride still maintained? V3 just shipped — here's the full picture"
published: false
description: "React Joyride went silent for months. Competitors called it dead. Then V3 dropped as a complete rewrite. Here's the release timeline, what changed, and what still isn't fixed."
tags: react, javascript, webdev, opensource
canonical_url: https://usertourkit.com/blog/is-react-joyride-still-maintained
---

*Originally published at [usertourkit.com](https://usertourkit.com/blog/is-react-joyride-still-maintained)*

# Is React Joyride still maintained in 2026?

If you searched this question, you probably found conflicting answers. Multiple blog posts published in late 2025 and early 2026 declared React Joyride "discontinued" or "unmaintained." Those posts were written during a release gap between November 2024 and March 2026. They're now outdated.

Here's what actually happened.

## Short answer: yes, React Joyride is actively maintained

React Joyride is maintained and received a ground-up V3 rewrite on March 23, 2026. As of April 2026, it has 673K weekly npm downloads, 7,687 GitHub stars, and only 3 open issues. Version 3.0.2 was published on April 1, 2026. The library supports React 16.8 through React 19, replaced Popper.js with Floating UI, and ships with a new hook-based API. It remains MIT-licensed and free.

## What happened during the "gap"

React Joyride went silent between November 2024 and March 2026, with no npm releases for roughly four months. During that window, React 19 shipped and broke V2, automated health checkers flagged the project, and competitor blogs declared it dead. The maintainer was quietly building V3 from scratch, but without any public communication about the rewrite.

Here's the timeline of what happened in parallel:

React 19 shipped. React Joyride V2 broke because it relied on `unmountComponentAtNode` and `unstable_renderSubtreeIntoContainer`, both removed in React 19. [GitHub issue #1122](https://github.com/gilbarbara/react-joyride/issues/1122) tracked this.

Package health analyzers like Snyk flagged the library. Their automated assessment noted "no new versions released to npm in the past 12 months" and suggested it "could be considered as discontinued."

Competitor articles piled on. OnboardJS wrote that "React Joyride hasn't been updated for nine months and isn't compatible with React 19." UserGuiding published a "6 React Joyride Alternatives" post. Multiple listicles moved React Joyride down their rankings or dropped it entirely.

Then V3 dropped. Three releases in nine days (3.0.0 on March 23, 3.0.1 on March 31, 3.0.2 on April 1). The maintainer, gilbarbara, had been quietly building a complete rewrite.

## What V3 actually changed

React Joyride V3 is a complete rewrite, not an incremental update. The maintainer replaced the positioning engine, rewrote the rendering pipeline, and introduced a modern hook-based API. Every major system in the library was rebuilt.

| Feature | V2 | V3 |
|---------|----|----|
| React 19 support | Broken | Full support (React 16.8-19) |
| Positioning engine | Popper.js / react-floater | @floating-ui/react-dom |
| Spotlight rendering | CSS box-shadow | SVG overlay (more precise) |
| API style | getHelpers callback | useJoyride() hook |
| Event system | Single callback with action/type strings | Discriminated event types |
| Async steps | Not supported | before/after hooks with loader support |
| Bundle size | ~498KB unpacked | ~30% smaller |
| Import style | Default export | Named export: `import { Joyride }` |
| Default run | run defaults to true | run defaults to false |

The Floating UI migration alone is significant. Popper.js stopped active development, so React Joyride was carrying a dependency with its own maintenance question mark. Floating UI is actively maintained by the same original author and used by Radix UI, Headless UI, and most modern positioning systems.

## Known issues that persist

Active maintenance doesn't mean every problem is solved. Several pain points from V2 carried forward into V3.

**Inline styles only.** React Joyride renders its tooltips with inline styles. If your team uses Tailwind CSS or a design token system, you'll end up overriding the default components to match your design system. One developer called this being "forced to override the default components" just to get consistent styling.

**Touch device quirks.** Double-tap required. Users on mobile report needing two taps to interact with tutorial elements, which breaks the expected flow.

**Multi-instance conflicts.** Running multiple Joyride instances on a single page causes unexpected behavior. Need a main tour and a feature tooltip running simultaneously? You'll hit this wall.

**Solo maintainer.** gilbarbara maintains React Joyride alone. No co-maintainers, no corporate sponsor, no visible sustainability model. The V3 rewrite proves commitment, but the bus factor remains 1.

## How React Joyride compares to alternatives

| Library | Weekly downloads | React 19 | License | Approach |
|---------|-----------------|----------|---------|----------|
| React Joyride | 673K | Yes (V3) | MIT | Opinionated UI with component overrides |
| Shepherd.js | ~130K | React wrapper has issues | Commercial license required | Framework-agnostic with wrappers |
| Driver.js | Lower | Framework-agnostic | MIT | Vanilla JS, smallest bundle |
| User Tour Kit | New | Yes | MIT (core) / Pro | Headless, composable packages |

**Bias disclosure:** We built User Tour Kit, so take this table with appropriate skepticism. Every data point is verifiable on npm and GitHub.

## When to choose React Joyride (and when not to)

**Choose React Joyride if:**
- You need something working fast and don't mind the default UI
- Your team doesn't use Tailwind or a strict design system
- You're on React 16.8+ through 19 and want broad version support
- Community size and existing solutions matter to your team

**Consider alternatives if:**
- You need full control over tooltip styling without fighting inline styles
- Your product runs on mobile devices where touch issues are a dealbreaker
- You need concurrent tour instances on the same page
- You want a headless approach where the library provides logic and you provide all the UI

Full article with code examples: [usertourkit.com/blog/is-react-joyride-still-maintained](https://usertourkit.com/blog/is-react-joyride-still-maintained)
