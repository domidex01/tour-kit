## Title: Tree-shaking product tour libraries: what actually gets removed

## URL: https://usertourkit.com/blog/tree-shaking-product-tour-libraries

## Comment to post immediately after:

I tested five React product tour libraries (React Joyride, Shepherd.js, Intro.js, Driver.js, and Tour Kit) to see how well they tree-shake when you only import a single hook.

The results: libraries without `sideEffects: false` in their package.json barely tree-shake at all (2-12% reduction). Libraries with it showed up to 64% reduction on a single-hook import.

The biggest surprise was how little bundler sophistication matters compared to the library's own package.json configuration. ESM format, the sideEffects flag, and subpath exports do most of the heavy lifting. Bundler heuristics barely move the needle if the library doesn't cooperate.

I built one of the libraries tested (Tour Kit), so take the comparison with appropriate skepticism. The methodology is in the article — Vite 6 + React 19, single-hook import, gzipped production builds measured via rollup-plugin-visualizer.
