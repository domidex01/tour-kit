## Subreddit: r/reactjs

**Title:** I tested 8 product tour libraries for TypeScript strict-mode compatibility — here's what I found

**Body:**

I've been evaluating product tour libraries for a React 19 project with strict TypeScript, and the results were more uneven than I expected.

Setup: Vite 6, react@19.0.0, typescript@5.7, tsconfig set to strict: true. For each library I installed it, defined a 5-step tour with custom metadata, checked autocomplete, tried generics, and ran tsc --noEmit.

**The findings:**

- Only 3 of 8 libraries compile clean under strict mode: Tour Kit (mine, bias disclosed), Driver.js, and Onborda
- React Joyride is written in TypeScript but its Step type resolves to `any` in certain configs (GitHub #949). It also hasn't published in 9 months, so React 19 fails
- Shepherd.js has types but its React wrapper (`react-shepherd`) throws compilation errors under strict: true
- Intro.js types are DefinitelyTyped — community maintained, lagging behind releases. Also AGPL licensed which is a non-starter for most SaaS
- Only 1 library (Tour Kit) supports generic step types — e.g. useStep<MyStepData>() with full inference

The biggest surprise was how much "has TypeScript support" varies in practice. Shipping .d.ts files doesn't mean much if the types regress between minor versions or don't cover the full API surface.

Full comparison table with bundle sizes, React 19 compat, and a decision framework: https://usertourkit.com/blog/product-tour-libraries-typescript-support

Happy to answer questions about the methodology or specific libraries.
