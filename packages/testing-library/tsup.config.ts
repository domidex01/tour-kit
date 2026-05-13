import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    setup: 'src/setup.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  treeshake: true,
  splitting: false,
  minify: false,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/react',
    '@testing-library/react',
    '@testing-library/user-event',
    'vitest',
    'jsdom-testing-mocks',
  ],
})
