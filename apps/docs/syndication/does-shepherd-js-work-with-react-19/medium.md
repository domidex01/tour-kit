# Does Shepherd.js Work with React 19? The Full Compatibility Story

### A 13-month gap, an AGPL license surprise, and what it means for your next React upgrade

*Originally published at [usertourkit.com](https://usertourkit.com/blog/does-shepherd-js-work-with-react-19)*

Shepherd.js broke on React 19 the day it shipped and stayed broken for thirteen months.

The react-shepherd wrapper depended on a React internal that React 19 renamed. Hard crash. Teams that upgraded between January 2025 and March 2026 had no working Shepherd tour until version 7.0.4 landed on March 11, 2026.

Here's the full picture for anyone evaluating Shepherd.js on React 19 today.

## The short answer

Shepherd.js technically works with React 19 as of react-shepherd 7.0.4. But the fix was a peer dependency relaxation, not an architectural change. Shepherd's core is written in Svelte, and the React wrapper remains a thin layer around vanilla JavaScript.

## What happened

The timeline from GitHub issue #3102 tells the story:

- **January 2025:** Issue opened. React 19 crashes Shepherd with a TypeError.
- **February 2025:** A developer who purchased Shepherd Pro reports it doesn't work either.
- **July 2025:** "This library is also preventing us from migrating React 19."
- **September 2025:** That same developer migrates away.
- **October 2025:** Community criticizes the lack of maintainer response.
- **January 2026:** Maintainer's first public response, 12 months later.
- **March 2026:** v7.0.4 released with the fix.

## Why this matters going forward

Shepherd.js is built in Svelte. The React integration is a wrapper, not a native implementation. Libraries that depend on React internals to bridge rendering models carry breakage risk on every major version upgrade.

As one reviewer put it: developers "will have to leave JSX behind and work either with HTML strings or plain HTML elements" for advanced Shepherd features.

## The AGPL factor

Shepherd.js uses AGPL-3.0. Any company generating revenue needs a commercial license. The react-shepherd wrapper is MIT-licensed, but AGPL obligations cascade through dependencies.

Both Intro.js and Shepherd.js use AGPL. If license matters, MIT-licensed options include React Joyride, Driver.js, and Tour Kit.

## When Shepherd.js is still the right choice

Shepherd.js has genuine strengths. SVG-based backdrop, 170+ releases, 100+ contributors, and cross-framework support. If you're running Vue and React side by side, Shepherd gives you one library.

If your project is AGPL-compatible and you don't need headless rendering, Shepherd.js at version 15.2.2 does work with React 19 now.

## For React 19 projects

A React-native tour library removes an entire category of risk. React Joyride (~706K weekly downloads) is the established choice. Tour Kit is newer but ships headless, accessible, and modular.

We built Tour Kit, so take this with appropriate skepticism. Every claim is verifiable on npm, GitHub, and bundlephobia.

Full article with comparison table and decision framework: [usertourkit.com/blog/does-shepherd-js-work-with-react-19](https://usertourkit.com/blog/does-shepherd-js-work-with-react-19)

*Suggest submitting to: JavaScript in Plain English, Better Programming, or Bits and Pieces publications.*
