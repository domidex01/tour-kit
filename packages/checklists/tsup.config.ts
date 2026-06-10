import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

export default defineConfig({
  entry: ['src/index.ts'],
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
  minify: true,
  target: 'es2020',
  async onSuccess() {
    // esbuild's `banner: '"use client"'` is stripped by the treeshake pass and
    // by minify — inject post-build instead (tooling/build/use-client.ts).
    injectUseClient(['index'])
  },
})
