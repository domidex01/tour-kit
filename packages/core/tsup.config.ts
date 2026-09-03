import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig({
  entry: {
    index: 'src/index.ts',
    'schemas/index': 'src/lib/schemas/index.ts',
    // v2 §1.2 — the React-free door. `splitting: true` puts the 35 shared
    // modules in a `chunk-*.js` beside it, so `dist/engine/index.js` is a
    // re-export shell: anything measuring or scanning it must follow the
    // import closure, never stat the entry file (see
    // `tooling/bundle-check/check-dist-gzip.mjs` and `_dist.ts`'s
    // `readClosure`).
    'engine/index': 'src/engine/index.ts',
  },
  format: ['cjs', 'esm'],
  dts: true,
  clean: true,
  external: ['react', 'react-dom', 'clsx', 'tailwind-merge', 'zod'],
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
  // The entry list here is deliberately NOT the entry list above: only the
  // React entry gets the directive. Stamping it onto `dist/engine/*` would
  // mark the framework-agnostic door as client-only. If this is ever migrated
  // to the shared `tooling/build/use-client.ts` injector, keep passing these
  // two files and nothing more — `no-react-in-engine-dist.test.ts` asserts
  // both halves.
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
