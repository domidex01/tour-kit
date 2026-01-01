import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    headless: 'src/headless.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', '@tour-kit/core', '@floating-ui/react'],
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
  },
})
