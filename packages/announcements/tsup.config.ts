import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

// Single config to avoid parallel DTS worker crashes on WSL2
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    'tailwind/index': 'src/tailwind/index.ts',
    'changelog/index': 'src/changelog/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/scheduling',
    '@floating-ui/react',
    '@radix-ui/react-dialog',
    'tailwindcss',
    'tailwindcss/plugin',
    '@tour-kit/license',
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";',
    }
  },
  // Copy CSS files to dist
  async onSuccess() {
    // Use sync methods to avoid dynamic import heap issues on WSL2
    fs.mkdirSync('dist/styles', { recursive: true })
    fs.copyFileSync('src/styles/variables.css', 'dist/styles/variables.css')
  },
})
