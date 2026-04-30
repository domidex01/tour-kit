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
    '@tour-kit/license',
  ],
  treeshake: true,
  splitting: false,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  // Note: esbuild's banner option is stripped by minify (the directive is
  // treated as a dead expression once it follows other code). Prepend it
  // manually in onSuccess instead so it survives.
  async onSuccess() {
    // Use sync methods to avoid dynamic import heap issues on WSL2
    try {
      for (const file of ['dist/index.js', 'dist/index.cjs']) {
        if (!fs.existsSync(file)) continue
        const content = fs.readFileSync(file, 'utf8')
        if (!/^['"]use client['"];?/.test(content)) {
          fs.writeFileSync(file, `'use client';\n${content}`)
        }
      }
      fs.mkdirSync('dist/styles', { recursive: true })
      fs.copyFileSync('src/styles/variables.css', 'dist/styles/variables.css')
      fs.copyFileSync('src/styles/theme.css', 'dist/styles/theme.css')
    } catch (e) {
      console.warn('Failed in onSuccess:', e)
    }
  },
})
