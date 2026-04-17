## Thread (6 tweets)

**1/** I tested tree-shaking on 5 React tour libraries by importing a single hook from each.

React Joyride: 31KB survived.
Tour Kit: 2.9KB survived.

The difference isn't bundler intelligence. It's three fields in package.json.

**2/** The #1 factor: `"sideEffects": false`

Without it, Vite and webpack assume every module might modify global state. They keep everything.

Libraries with the flag: 64% reduction.
Libraries without: 2-12%.

**3/** The #2 factor: ESM vs CJS

Tree-shaking requires static import/export analysis. CommonJS require() is dynamic — bundlers can't prove what's unused.

Check for `"type": "module"` and an `exports` map in package.json.

**4/** The #3 factor: subpath exports

`@tourkit/react/headless` only loads headless components. Styled components, Tailwind utils, and lazy wrappers stay out.

React Joyride has one entry point. Everything or nothing.

**5/** How to verify yourself:

1. `npm i -D rollup-plugin-visualizer`
2. Add to Vite config with `gzipSize: true`
3. `npx vite build`
4. Comment out the import, rebuild, compare

Takes 5 minutes. Don't trust library authors (including me).

**6/** Full deep-dive with comparison table, tsup config, and the three most common mistakes that break tree-shaking:

https://usertourkit.com/blog/tree-shaking-product-tour-libraries

(Disclosure: I built Tour Kit. Methodology is reproducible.)
