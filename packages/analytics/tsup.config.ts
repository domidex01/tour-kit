import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'plugins/posthog': 'src/plugins/posthog.ts',
    'plugins/mixpanel': 'src/plugins/mixpanel.ts',
    'plugins/amplitude': 'src/plugins/amplitude.ts',
    'plugins/google-analytics': 'src/plugins/google-analytics.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    '@amplitude/analytics-browser',
    '@tour-kit/core',
    '@tour-kit/license',
    'mixpanel-browser',
    'posthog-js',
    'react',
    'react-dom',
  ],
  treeshake: true,
  splitting: false,
  // NOTE: do not use the umbrella `minify: true`. esbuild's whitespace
  // minifier strips the `/* webpackIgnore */` / `/* @vite-ignore */` magic
  // comments on the optional-SDK `import()` calls in the plugins, which
  // reintroduces the `Module not found` build failure when an optional peer
  // (posthog-js, mixpanel-browser, @amplitude/analytics-browser) isn't
  // installed. We minify identifiers + syntax (keeps gzip size flat after
  // compression) but leave whitespace so the magic comments survive into dist.
  // Guarded by src/__tests__/build/optional-imports.bundler-guard.test.ts.
  minify: false,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    options.minifyIdentifiers = true
    options.minifySyntax = true
    options.minifyWhitespace = false
    options.banner = {
      js: '"use client";',
    }
  },
})
