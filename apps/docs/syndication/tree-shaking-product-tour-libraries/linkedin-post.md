Most React tour libraries don't tree-shake. I tested five to find out why.

I imported a single hook from each library into a Vite 6 + React 19 project and measured what survived in the production bundle:

- React Joyride: 31KB (9% reduction from full 34KB)
- Shepherd.js: 22KB (12% reduction)  
- Tour Kit: 2.9KB (64% reduction from full 8.1KB)

The single biggest factor wasn't bundler sophistication. It was whether the library declared `"sideEffects": false` in its package.json. Without that flag, bundlers conservatively keep every module.

Three fields in package.json predict tree-shaking behavior: sideEffects, module format (ESM vs CJS), and subpath exports. You can check all three in 30 seconds before installing any dependency.

Full analysis with code examples and a step-by-step guide to running your own bundle analysis: https://usertourkit.com/blog/tree-shaking-product-tour-libraries

#react #javascript #webperformance #bundlesize #opensource
