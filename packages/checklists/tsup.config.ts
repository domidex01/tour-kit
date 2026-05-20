import { defineConfig } from 'tsup'

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
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
})
