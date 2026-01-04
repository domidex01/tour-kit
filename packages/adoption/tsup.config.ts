import { defineConfig } from 'tsup'

export default defineConfig([
  // Main entry
  {
    entry: ['src/index.ts'],
    format: ['esm', 'cjs'],
    dts: true,
    clean: true,
    external: ['react', 'react-dom', '@tour-kit/core', 'tailwindcss', 'tailwindcss/plugin'],
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
      await fs.mkdir('dist/styles', { recursive: true })
      await fs.copyFile('src/styles/variables.css', 'dist/styles/variables.css')
      await fs.copyFile('src/styles/theme.css', 'dist/styles/theme.css')
    },
  },
  // Tailwind plugin entry
  {
    entry: ['src/tailwind/index.ts'],
    format: ['esm', 'cjs'],
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
