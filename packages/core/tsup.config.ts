import * as fs from 'node:fs'
import { defineConfig } from 'tsup'

export default defineConfig([
  {
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
    // v2 §1.6 — NOT `true`. tsup builds array items in parallel and each runs its
    // own clean (`tsup/dist/index.js:1589-1594`), so a plain `clean: true` here
    // races the IIFE item's output and can delete it. The array is passed through
    // as extra globs to `removeFiles(['**/*', ...extra])`, and tsup itself
    // `unshift`s a negative `'!**/*.d.{ts,cts,mts}'` onto it when `dts` is on —
    // so negation through this path is tsup's own mechanism, not a trick.
    // Consequence to know: this also protects a STALE `.global.js` forever. If
    // the IIFE entry is ever renamed, check `ls dist/engine/` shows exactly one.
    clean: ['!**/*.global.js*'],
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
  },
  {
    // v2 §1.6 — the CDN door: the `/engine` barrel as one self-contained IIFE
    // at `dist/engine/index.global.js`, which `unpkg` and `jsdelivr` point at.
    //
    // Its OWN item, never a third format on the item above: `format: [...,
    // 'iife']` there would also emit IIFEs of `index` and `schemas`, and
    // esbuild turns their externals into a `__require("react")` shim that
    // throws `Dynamic require of "react" is not supported` on load. Two
    // landmines in the tarball for a file nobody asked for.
    entry: { 'engine/index': 'src/engine/index.ts' },
    format: ['iife'],
    globalName: 'TourKit',
    // LOAD-BEARING. esbuild defines `process.env.NODE_ENV` itself only under
    // `platform: 'browser'`; with tsup's default (`node`) the output keeps four
    // `process.env` reads, two of them unguarded (`lib/interpolate.ts`'s
    // `warnOnMissing` default parameter and `lib/audience.ts`'s segment
    // warning), and a browser throws `ReferenceError: process is not defined`
    // on the first `interpolate()` or segment audience. The file LOADS either
    // way — the throw is deferred to the first call, which is why
    // `engine-iife-dist.test.ts` both greps for `process.env` and runs the file
    // in a `vm` realm that has no `process`.
    platform: 'browser',
    outDir: 'dist',
    // The main item cleans (with the negative glob above); both build in
    // parallel, so a second clean here would be the race that guards nothing.
    clean: false,
    // A classic script has no types to resolve; `dist/engine/index.d.ts`
    // already serves every consumer who typechecks.
    dts: false,
    external: ['react', 'react-dom', 'clsx', 'tailwind-merge', 'zod'],
    treeshake: true,
    minify: true,
    sourcemap: true,
    target: 'es2020',
  },
])
