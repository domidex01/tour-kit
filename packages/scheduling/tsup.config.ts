import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    // v3 Phase 0 — the React-free door. Deliberately absent from the
    // `injectUseClient(['index'])` call below: stamping 'use client' here would
    // mark a framework-agnostic entry client-only. Both halves are asserted in
    // `src/__tests__/no-react-in-engine-dist.test.ts`.
    'engine/index': 'src/engine/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@tour-kit/analytics', '@tour-kit/license'],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  async onSuccess() {
    // esbuild's `banner: '"use client"'` is stripped by the treeshake pass and
    // by minify — inject post-build instead (tooling/build/use-client.ts).
    injectUseClient(['index'])
  },
})
