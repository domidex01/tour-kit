import * as fs from 'node:fs'
import { defineConfig } from 'tsup'
import { injectUseClient } from '../../tooling/build/use-client'

// Single config to avoid parallel DTS worker crashes on WSL2
export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
    lazy: 'src/lazy.tsx',
    'tailwind/index': 'src/tailwind/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: [
    'react',
    'react-dom',
    '@tour-kit/core',
    '@tour-kit/analytics',
    '@floating-ui/react',
    'tailwindcss',
    'tailwindcss/plugin',
    // Router adapters - these are optional peer dependencies
    'next/navigation',
    'next/router',
    'react-router',
    'react-router-dom',
  ],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  async onSuccess() {
    // esbuild's `banner: '"use client"'` is stripped by the treeshake pass and
    // by minify, so the dist shipped WITHOUT the directive. Inject post-build
    // instead (see tooling/build/use-client.ts). tailwind/index is a
    // build-time Node module — keep it directive-free.
    injectUseClient(['index', 'headless', 'lazy'])

    // Use sync methods to avoid dynamic import heap issues on WSL2
    fs.mkdirSync('dist/styles', { recursive: true })
    fs.copyFileSync('src/styles/variables.css', 'dist/styles/variables.css')
    fs.copyFileSync('src/styles/components.css', 'dist/styles/components.css')
    fs.copyFileSync('src/styles/theme.css', 'dist/styles/theme.css')
  },
})
