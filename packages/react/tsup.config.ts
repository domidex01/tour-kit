import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry
  {
    entry: {
      index: 'src/index.ts',
      headless: 'src/headless.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    clean: true,
    external: [
      'react',
      'react-dom',
      '@tour-kit/core',
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
    splitting: false,
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
    onSuccess: async () => {
      const fs = await import('node:fs/promises')

      // Ensure styles directory exists
      await fs.mkdir('dist/styles', { recursive: true })

      // Copy CSS files
      await fs.copyFile('src/styles/variables.css', 'dist/styles/variables.css')
      await fs.copyFile('src/styles/components.css', 'dist/styles/components.css')
      await fs.copyFile('src/styles/theme.css', 'dist/styles/theme.css')
    },
  },
  // Tailwind plugin entry
  {
    entry: {
      index: 'src/tailwind/index.ts',
    },
    format: ['cjs', 'esm'],
    dts: true,
    external: ['tailwindcss', 'tailwindcss/plugin'],
    treeshake: true,
    splitting: false,
    minify: true,
    sourcemap: true,
    target: 'es2020',
    outDir: 'dist/tailwind',
  },
])
