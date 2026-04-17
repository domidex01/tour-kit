## Channel: #articles or #show-off in Reactiflux

**Message:**

Wrote up a deep-dive on how well React tour libraries tree-shake. Tested React Joyride, Shepherd.js, Driver.js, Intro.js, and Tour Kit with Vite's bundle analyzer — importing a single hook from each. The spread was 2.9KB to 31KB for the same use case. Turns out `sideEffects: false` in package.json does most of the heavy lifting.

https://usertourkit.com/blog/tree-shaking-product-tour-libraries

Would be curious if anyone's seen similar results with other UI library categories.
