## Title: Lazy loading product tours with React.lazy and Suspense

## URL: https://usertourkit.com/blog/lazy-loading-product-tours-react-lazy-suspense

## Comment to post immediately after:

Product tour libraries (React Joyride, Shepherd.js, etc.) are 22-50KB gzipped and never used on initial render, but they get bundled into the main chunk by default. This is a writeup of the pattern for splitting them out with React.lazy.

The interesting parts that aren't in typical code-splitting tutorials:

1. Tours are interaction-triggered (not route-triggered), which makes the split boundary unusually clean. The import fires on first login, feature release, or help button click.

2. webpackPrefetch magic comments let you download the tour chunk during idle time. In testing: ~180ms without prefetch, ~20ms with it.

3. The accessibility angle is completely absent from existing articles. When a lazy-loaded component mounts, screen readers don't announce it. WCAG 2.2 SC 2.4.3 applies.

4. Error Boundaries are non-optional in production. Deployments invalidate chunk hashes, and without a boundary the tour silently breaks.

5. Minor security benefit: eagerly bundled tour code exposes step definitions, feature flag names, and segmentation logic in the source map to every user.

The Next.js SSR caveat (React.lazy throws during server render) and the over-splitting anti-pattern (individual steps as separate chunks) are also covered.

Wrote this while working on Tour Kit, a headless product tour library for React. The headless architecture actually makes the lazy boundary cleaner because the styles already exist in the main bundle as part of the design system.
