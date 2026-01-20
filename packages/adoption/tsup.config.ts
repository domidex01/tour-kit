import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

// Single config to avoid parallel DTS worker crashes on WSL2
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  format: ['esm', 'cjs'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/analytics',
    'tailwindcss',
    'tailwindcss/plugin',
    'class-variance-authority',
    'clsx',
    'tailwind-merge',
  ],
  treeshake: true,
  splitting: false,
  minify: false,
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
    try {
      fs.mkdirSync('dist/styles', { recursive: true })
      fs.copyFileSync('src/styles/variables.css', 'dist/styles/variables.css')
      fs.copyFileSync('src/styles/theme.css', 'dist/styles/theme.css')
    } catch (e) {
      console.warn('Failed to copy CSS files:', e)
    }
  },
})
