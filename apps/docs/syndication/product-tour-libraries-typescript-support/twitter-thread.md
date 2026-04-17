## Thread (6 tweets)

**1/** I tested 8 product tour libraries in a TypeScript strict-mode project.

Only 3 of 8 compiled clean.

Here's what "TypeScript support" actually means for each one: 🧵

**2/** The 3 that pass strict mode: Tour Kit, Driver.js, and Onborda.

All three are written in TypeScript natively — types ship with the package, not from DefinitelyTyped.

**3/** React Joyride is written in TypeScript, but its Step type resolves to `any` in certain configs (GH #949).

Plus it hasn't published in 9 months. React 19 fails to compile.

**4/** Shepherd.js has types, but the React wrapper breaks under strict: true.

Intro.js uses community-maintained @types that lag behind releases. Also AGPL — non-starter for most SaaS.

**5/** The biggest gap: only 1 library supports generic step types.

useStep<MyStepData>() with full type inference. No casting, no any.

(It's Tour Kit — bias disclosed, I built it.)

**6/** Full comparison table with bundle sizes, React 19 compat, and a decision framework:

https://usertourkit.com/blog/product-tour-libraries-typescript-support
