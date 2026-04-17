## Title: Which product tour libraries support TypeScript? (strict-mode tested)

## URL: https://usertourkit.com/blog/product-tour-libraries-typescript-support

## Comment to post immediately after:

I tested 8 product tour libraries in a Vite 6 + React 19 + TypeScript 5.7 strict-mode project. The goal was to check whether "TypeScript support" means native types, retrofitted declarations, or DefinitelyTyped stubs.

Results: only 3 of 8 compile clean under strict mode. React Joyride's Step type has regressed to `any` in certain configurations. Shepherd.js's React wrapper breaks under strict. Intro.js relies on community-maintained @types that lag behind.

I built one of the libraries tested (Tour Kit), which is disclosed in the article. Every data point is verifiable against npm, GitHub, and bundlephobia.

The comparison table and decision framework are in the article. Curious if others have run into the same TypeScript issues with tour libraries.
