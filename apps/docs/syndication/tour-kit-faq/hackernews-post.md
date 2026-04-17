## Title: 20 questions developers ask before installing a React product tour library

## URL: https://usertourkit.com/blog/tour-kit-faq

## Comment to post immediately after:

I maintain Tour Kit, a headless product tour library for React, and I noticed I kept answering the same questions. So I compiled them all into one FAQ with verifiable data.

A few things I found interesting while researching:

The bundle size spread across tour libraries is roughly 100x. Driver.js at ~5KB vs React Joyride at 498KB unpacked. The practical advice regardless of which library you pick: lazy-load tour code, never include it in your initial bundle.

React 19 compatibility is a real problem. The most popular library (React Joyride, 400K+ weekly downloads) hasn't been updated in 9+ months. Shepherd's React wrapper has issues too. This isn't widely known until you hit the errors.

Accessibility is another gap. An independent audit found Intro.js missing aria-labelledby attributes and implementing buttons as links. Shepherd does better. Most developers don't check this before installing.

I'm obviously biased since I built Tour Kit, and I tried to be transparent about that throughout. Happy to discuss the headless UI approach to product tours or answer questions about the ecosystem.
