/**
 * The per-entry gzip budgets the merge gate enforces, as data.
 *
 * Its own module so it can be imported without running the checker — the
 * checker is a script with top-level side effects (it walks every row and sets
 * `process.exitCode`), so a test that wanted these numbers used to recover them
 * by regex-scraping the script's source. Now it imports them.
 *
 * Every row is measured as an IMPORT CLOSURE (see `closure.mjs`), not as the
 * entry file. Once a package emits more than one tsup entry, `splitting: true`
 * moves the shared code into a `chunk-*.js` and the entry becomes a re-export
 * shell. Statting that shell reported a 6 KB *improvement* for core the day the
 * engine subpath landed, while the bytes a consumer resolves went UP 1.2 KB.
 * Single-entry packages measure identically to before, so every pre-existing
 * budget keeps its meaning.
 *
 * The closure is summed as per-file gzip rather than gzipped once as a
 * concatenation, because that is how the bytes actually travel: a server
 * compresses each file it serves on its own, with no shared dictionary.
 *
 * Note the rows are NOT additive. `core` and `core:engine` both count the full
 * shared chunk, because each is what that consumer alone resolves; someone
 * importing both pays for the chunk once.
 *
 * Budgets = the 2026-05-23 audit's raw dist gzip measurement + ~20% headroom.
 * Exceptions documented inline:
 *   - core: 21.5 KB ceiling, measuring the closure (8.5 KB entry + 12.8 KB
 *     shared chunk = 21.3 KB). NOT a relaxation of the old 20 KB: that number
 *     measured a self-contained entry that no longer exists. The CLAUDE.md
 *     target is <8 KB, tracked as audit B-1 — still §1.4's to earn, when the
 *     hooks stop pulling the whole provider.
 *
 *     Raised from 21 000 in v2 §1.3 against a measured 21 271, up from 20 825.
 *     The +446 B is the module-boundary cost of the port/adapter split: 636
 *     lines left `tour-provider.tsx` for six modules, and esbuild can no longer
 *     inline what used to be same-file calls. It is NOT engine runtime leaking
 *     into the main entry — `engine-not-in-main-closure.test.ts` proves
 *     `createTourEngine` stays out, matching on a string literal rather than
 *     the identifier because `minify: true` renames the function and the
 *     obvious grep passes either way.
 *   - core:engine: 16 KB against a measured 15.3 KB (2.5 KB entry + the same
 *     12.8 KB chunk), up from 8.1 KB when this was a types-and-predicates door.
 *     The difference is a working tour engine: reducer, boot resolver, actions,
 *     transition effects and four storage adapters. §1.3's plan expected
 *     13–14 KB; the measured number is the number. A type-only consumer still
 *     ships zero (types erase, the barrel is re-exports-only and
 *     `sideEffects: false`), so this row is the worst case — import everything
 *     — not the common one.
 *   - hints, announcements, surveys, media, ai:client: re-baselined in v2 §1.2
 *     WITHOUT a byte being added. All five ship a `headless` entry alongside
 *     `index`, so they have been split since long before core was, and the
 *     entry-file gate was reading their shell (announcements: 6 517 measured
 *     against a 13 322 reality). The new numbers are the first honest ones.
 *     Do not compare them to a pre-§1.2 build unless you re-measure it the
 *     new way.
 *
 * There is no `analytics:console` row. The console plugin ships inside
 * `analytics/dist/index.js` (the always-on default) — it is not a tsup entry
 * point, so no standalone `dist/plugins/console.js` is emitted. Gating a file
 * that is never built would always report MISSING; it is covered by
 * `analytics:main` instead.
 *
 * Adding a row here without stating it in CLAUDE.md fails
 * `bundle-budget-claim-alignment.test.ts`. That is deliberate: a budget nobody
 * can find is a budget nobody defends.
 *
 * @type {Array<[name: string, relPath: string, budgetBytes: number]>}
 */
export const budgets = [
  ['core', 'packages/core/dist/index.js', 21500],
  ['core:engine', 'packages/core/dist/engine/index.js', 16000],
  ['react', 'packages/react/dist/index.js', 12000],
  ['hints', 'packages/hints/dist/index.js', 6000],
  ['analytics:main', 'packages/analytics/dist/index.js', 4000],
  ['analytics:posthog', 'packages/analytics/dist/plugins/posthog.js', 1500],
  ['analytics:mixpanel', 'packages/analytics/dist/plugins/mixpanel.js', 1500],
  ['analytics:amplitude', 'packages/analytics/dist/plugins/amplitude.js', 1000],
  ['analytics:ga', 'packages/analytics/dist/plugins/google-analytics.js', 1000],
  ['adoption', 'packages/adoption/dist/index.js', 10000],
  ['checklists', 'packages/checklists/dist/index.js', 10000],
  ['announcements', 'packages/announcements/dist/index.js', 14000],
  ['surveys', 'packages/surveys/dist/index.js', 12500],
  ['media', 'packages/media/dist/index.js', 9000],
  ['ai:client', 'packages/ai/dist/index.js', 7000],
  ['ai:server', 'packages/ai/dist/server/index.js', 8000],
  ['scheduling', 'packages/scheduling/dist/index.js', 4000],
  ['license', 'packages/license/dist/index.js', 8000],
]
