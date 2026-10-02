import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // No `injectUseClient`: there is no `'use client'` on a non-React package,
  // and stamping a React directive onto the package whose whole point is not
  // being React would be a lie a bundler acts on.
  external: ['@tour-kit/core', 'vue'],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
})
