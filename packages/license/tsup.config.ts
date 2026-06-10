import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

export default defineConfig({
  entry: ['src/index.ts', 'src/headless.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@tour-kit/core'],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  async onSuccess() {
    // esbuild's `banner: '"use client"'` is stripped by the treeshake pass and
    // by minify — inject post-build instead (tooling/build/use-client.ts).
    // headless must stay directive-free: it is the React-free entry consumed
    // from server code (see CLAUDE.md "tree-shaking boundary").
    injectUseClient(['index'])
  },
})
