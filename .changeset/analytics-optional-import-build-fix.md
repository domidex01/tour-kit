---
"@tour-kit/analytics": patch
---

Fix `next build` / webpack `Module not found` when an optional analytics peer
(`posthog-js`, `mixpanel-browser`, `@amplitude/analytics-browser`) isn't
installed. The guarded dynamic `import()` for each optional SDK now carries a
`/* webpackIgnore: true */ /* @vite-ignore */` magic comment, so bundlers leave
the import for runtime instead of resolving it at build time. The plugins
already degraded gracefully at runtime; this extends that to the build.

tsup no longer uses the umbrella `minify: true` (esbuild's whitespace minifier
strips the magic comments); it minifies identifiers + syntax only, which keeps
the gzipped bundle size flat. Regression-guarded by a dist magic-comment check,
a real webpack build smoke test, runtime-optionality tests for all three SDKs,
and a `peerDependenciesMeta.optional` contract test.
