import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  splitting: false,
  sourcemap: true,
  clean: true,
  treeshake: true,
  minify: true,
  target: 'es2020',
  external: ['react', 'react-dom', '@tour-kit/core', '@floating-ui/react'],
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
