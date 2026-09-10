import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // v3 Phase 2 — the React-free door. Deliberately absent from the
    // `injectUseClient(['index'])` call below: stamping 'use client' here
    // would mark a framework-agnostic entry client-only. A second entry turns
    // `splitting` on, so this shell sits beside `chunk-*.js` — measure and
    // scan the import CLOSURE, never this file.
    'engine/index': 'src/engine/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/analytics',
    '@tour-kit/license',
    '@floating-ui/react',
  ],
  treeshake: true,
  // explicit: it was tsup's ESM default and invisible while there was one entry
  splitting: true,
  minify: true,
  target: 'es2020',
  async onSuccess() {
    // esbuild's `banner: '"use client"'` is stripped by the treeshake pass and
    // by minify — inject post-build instead (tooling/build/use-client.ts).
    injectUseClient(['index'])
  },
})
