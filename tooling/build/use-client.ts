import * as fs from 'node:fs'

/**
 * Prepend `'use client'` to built entry files after tsup finishes.
 *
 * esbuild's `banner` option does NOT survive the tsup pipeline: the rollup
 * treeshake pass drops module-level directives (`"use client" ... was
 * ignored`), and `minify: true` additionally strips them as dead expressions.
 * Prepending in `onSuccess` is the only placement that survives — the same
 * pattern @tour-kit/core and @tour-kit/adoption already use inline.
 *
 * Only entry files get the directive. Split chunks sit behind the entry's
 * client boundary, and build-time entries (tailwind plugins, server entries)
 * must stay directive-free so they remain importable from server code.
 *
 * @param entryNames entry names as written in the tsup `entry` map, e.g.
 *   `['index', 'headless', 'plugins/posthog']`. Each expands to
 *   `<distDir>/<name>.js` + `.cjs`.
 */
export function injectUseClient(entryNames: string[], distDir = 'dist'): void {
  for (const name of entryNames) {
    let patchedOrPresent = 0
    for (const ext of ['js', 'cjs']) {
      const file = `${distDir}/${name}.${ext}`
      if (!fs.existsSync(file)) continue
      const content = fs.readFileSync(file, 'utf8')
      if (!/^['"]use client['"];?/.test(content)) {
        fs.writeFileSync(file, `'use client';\n${content}`)
      }
      patchedOrPresent++
    }
    if (patchedOrPresent === 0) {
      // Correctness-critical (RSC compatibility) — fail loud on entry drift.
      throw new Error(
        `injectUseClient: no dist file found for entry "${name}" (expected ${distDir}/${name}.js|.cjs)`
      )
    }
  }
}
