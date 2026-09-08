import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  // No `injectUseClient`: there is no `'use client'` on a non-React package.
  // `svelte/reactivity` and `svelte/action` are separate specifiers and must
  // each be external, or tsup inlines a copy of the runtime.
  external: ['@tour-kit/core', 'svelte', 'svelte/reactivity', 'svelte/action'],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
})
