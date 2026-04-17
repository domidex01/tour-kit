## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote a deep-dive on how we keep Tour Kit (React product tour library) at 8.1KB gzipped with zero runtime deps. Covers the tsup config, core/UI architecture split, and the five decisions that account for most of the size difference vs React Joyride (34KB) and Shepherd.js (25KB).

https://usertourkit.com/blog/tour-kit-8kb-zero-dependencies

Curious if anyone has found other patterns for keeping React libraries small. The ES2020 target decision alone saved a surprising amount of polyfill bloat.
