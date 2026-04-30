import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'clsx', 'tailwind-merge'],
  treeshake: true,
  splitting: true,
  minify: true,
  sourcemap: true,
  target: 'es2020',
  outDir: 'dist',
  // esbuild's banner option is stripped by minify (the directive is treated
  // as a dead expression once it follows other code). Prepend in onSuccess
  // so the 'use client' directive survives — required for the React-stateful
  // exports (TourProvider, useTour, etc.) to work in Next.js Server Components.
  async onSuccess() {
    for (const file of ['dist/index.js', 'dist/index.cjs']) {
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf8')
      if (!/^['"]use client['"];?/.test(content)) {
        fs.writeFileSync(file, `'use client';\n${content}`)
      }
    }
  },
})
