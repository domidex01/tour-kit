/**
 * v2 §1.6 — the CDN door: `dist/engine/index.global.js`.
 *
 * This is the first consumer that evaluates the engine with NO bundler define
 * and NO Node globals, so the file is guarded on two axes:
 *
 *   TEXT   — what the bytes may not contain (`require(`, `import.meta`,
 *            `process.env`). Fast, unambiguous, and the `process.env` case is
 *            the one that goes red if `platform: 'browser'` is ever tidied out
 *            of `tsup.config.ts`. Nothing else here does.
 *   REALM  — what the file DOES, in the realm that matters. vitest's jsdom has
 *            `process`, so a jsdom run passes identically on a build that would
 *            throw for every CDN user. The `vm` realm below does not.
 *
 * Neither axis is sufficient. Deleting the grep leaves the cause undocumented;
 * deleting the realm case leaves a proxy nobody can justify.
 */
import { existsSync, readFileSync } from 'node:fs'
import vm from 'node:vm'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { ENGINE_IIFE, distExists } from './_dist'

interface TourKitEngine {
  start(id: string): Promise<void>
  next(): Promise<void>
  destroy(): void
  subscribe(listener: () => void): () => void
  getState(): { isActive: boolean; currentStep?: { id: string } | null }
}

/**
 * A local shape, not a contract. `packages/core/tsconfig.json` excludes
 * `**\/*.test.ts`, so `tsc` (and the safe-ship-gate hook) never sees this file —
 * this interface exists to keep the calls readable and biome off `any`, and it
 * will NOT catch a barrel change. The `>= 80` key count below is what does.
 */
interface TourKitGlobal {
  createTourEngine(options: unknown): TourKitEngine
  createMemoryStorage(): unknown
  createFocusTrap: unknown
  interpolate(template: string, values: Record<string, unknown>): string
  [key: string]: unknown
}

/** Read once, lazily — 54 KB, a dozen cases, and an unbuilt package must skip rather than throw. */
let cached: string | null = null
const source = (): string => {
  cached ??= readFileSync(ENGINE_IIFE, 'utf8')
  return cached
}

/**
 * Evaluate the IIFE into a local binding.
 *
 * The `\n` is LOAD-BEARING: the file's last line is a `//# sourceMappingURL=`
 * comment with no trailing newline (there are two of them — tsup appends one,
 * rollup's IIFE wrapper the other), so `` `${src}; return TourKit` `` puts the
 * `return` inside that comment and this yields `undefined` — a permanent false
 * red against a perfectly good build.
 *
 * `new Function` keeps `var TourKit` function-scoped, so nothing leaks into the
 * next test file in this worker. `vm.runInThisContext` would leak; do not swap
 * it in. (`apps/smoke`'s probe uses it freely — it is a one-shot script.)
 */
const loadIIFE = (): TourKitGlobal => new Function(`${source()}\nreturn TourKit`)() as TourKitGlobal

/** Two steps against real DOM targets — for the jsdom describe. */
const TARGETED_TOUR = {
  id: 't',
  steps: [
    { id: 's1', target: '#a', content: 'first' },
    { id: 's2', target: '#b', content: 'second' },
  ],
}

/**
 * The same two steps with no `target` — for the `vm` realm, which has no
 * `document` at all. The missing targets are the point, not an oversight: this
 * is the headless path, and a step with a target would look for one.
 */
const TARGETLESS_TOUR = {
  id: 't',
  steps: [
    { id: 's1', content: 'first' },
    { id: 's2', content: 'second' },
  ],
}

describe.skipIf(!distExists())('v2 §1.6 — the IIFE is emitted and shaped like a CDN script', () => {
  it('exists', () => {
    // The FILE, never the directory: `clean` leaves an empty `dist/engine/`
    // behind, so a directory check passes on a build that emits nothing.
    expect(existsSync(ENGINE_IIFE)).toBe(true)
  })

  it('starts with the global assignment', () => {
    expect(source().slice(0, 12)).toBe('var TourKit=')
  })

  it('has no `require(` — an external that leaked would appear as one', () => {
    // esbuild turns an external import into a `__require("clsx")` shim that
    // throws `Dynamic require of "clsx" is not supported` on load. This is the
    // guard behind "never add 'iife' to the main item's format" — an IIFE of
    // `index` or `schemas` ships exactly that shim for react/zod.
    expect(source().match(/\brequire\s*\(/g) ?? []).toEqual([])
  })

  it('has no `import.meta` — a classic script has no module scope', () => {
    expect(source().match(/import\.meta/g) ?? []).toEqual([])
  })

  it("has no `process.env` — platform:'browser' is what keeps a browser from throwing", () => {
    // THE red-first case. Build once WITHOUT `platform: 'browser'` on the IIFE
    // item and this reports 4 matches: two guarded (`typeof process` in
    // logger/test-bridge) and two NOT — `interpolate`'s `warnOnMissing` default
    // parameter and `audience`'s segment warning. Those two are why a CDN user
    // gets `ReferenceError: process is not defined` on their first tour.
    //
    // It is also the ONLY case in this file that goes red on that build: the
    // `require(` count is 0 either way, and the jsdom run passes either way
    // (vitest's jsdom has `process`). See the realm describe below.
    expect(source().match(/process\.env/g) ?? []).toEqual([])
  })

  it('does NOT start with the `use client` directive', () => {
    // The React entry gets it via tsup's inline onSuccess; the engine door must
    // not, or a framework-agnostic file is marked client-only.
    expect(/^['"]use client['"];?/.test(source())).toBe(false)
  })
})

describe.skipIf(!distExists())('v2 §1.6 — it runs a tour under jsdom', () => {
  beforeEach(() => {
    // Hand-appended nodes are ours to clean: the shared afterEach `cleanup()`
    // only removes what @testing-library rendered, and a stale `#a` from a
    // previous case wins the selector.
    document.body.innerHTML = '<button id="a">A</button><button id="b">B</button>'
  })
  afterEach(() => {
    document.body.innerHTML = ''
  })

  it('creates an engine, starts, advances, destroys', async () => {
    const TourKit = loadIIFE()
    expect(typeof TourKit.createTourEngine).toBe('function')

    const engine = TourKit.createTourEngine({
      tours: [TARGETED_TOUR],
      storage: TourKit.createMemoryStorage(),
    })

    let notifications = 0
    const unsubscribe = engine.subscribe(() => {
      notifications++
    })

    await engine.start('t')
    expect(engine.getState().isActive).toBe(true)
    expect(engine.getState().currentStep?.id).toBe('s1')
    // `>= 1`, never a total: the running count after `next()` is 4 today, which
    // is a dispatch-chain detail and will drift.
    expect(notifications).toBeGreaterThanOrEqual(1)

    await engine.next()
    expect(engine.getState().currentStep?.id).toBe('s2')

    unsubscribe()
    expect(() => engine.destroy()).not.toThrow()
  })

  it('carries the DOM behaviours, not just the state machine', () => {
    expect(typeof loadIIFE().createFocusTrap).toBe('function')
  })

  it('exports the whole barrel — a collapsed bundle would not', () => {
    // 88 keys today. `>=` on purpose: the barrel grows every slice, and a `toBe`
    // would fail the build for adding an export. This tripwire is for the
    // barrel COLLAPSING (a bad treeshake, a wrong entry), which 80 catches.
    expect(Object.keys(loadIIFE()).length).toBeGreaterThanOrEqual(80)
  })

  it('does not pollute globalThis', () => {
    loadIIFE()
    expect((globalThis as Record<string, unknown>).TourKit).toBeUndefined()
  })
})

describe.skipIf(!distExists())('v2 §1.6 — it runs in a realm with no `process`', () => {
  /**
   * The browser case, as close as vitest can get to it. jsdom gives us
   * `document` but keeps Node's `process`, so every case above passes on a
   * `platform: 'node'` build too. This realm has neither, which is what makes it
   * the only in-vitest witness for the platform flag.
   *
   * The realm supplies its own `Object`/`Array`/`Promise` intrinsics; the four
   * globals passed in are the ones a browser has and a bare `vm` context does
   * not. `AbortController` is one of them — `createTourEngine`'s boot dispatch
   * constructs one, so leaving it out fails this case for a reason that has
   * nothing to do with the flag under test. `process` is deliberately NOT
   * passed: it is the whole discriminator.
   */
  const realm = (): { ctx: vm.Context; TourKit: TourKitGlobal } => {
    const ctx = vm.createContext({ console, setTimeout, clearTimeout, AbortController })
    vm.runInContext(source(), ctx)
    // The one cast, here rather than at three call sites: `vm.Context` is
    // `object`, so every consumer would otherwise re-assert the same shape.
    return { ctx, TourKit: (ctx as { TourKit: TourKitGlobal }).TourKit }
  }

  it('the realm really has no `process` (control — otherwise this proves nothing)', () => {
    expect(vm.runInContext('typeof process', realm().ctx)).toBe('undefined')
  })

  it('loads, and `interpolate()` returns instead of throwing', () => {
    // Against a `platform`-less build this is
    // `ReferenceError: process is not defined`, thrown from `interpolate`'s
    // `warnOnMissing = process.env.NODE_ENV !== 'production'` default parameter.
    // Note the file LOADS either way — the throw is deferred to the first call,
    // so a test that only evaluates the source proves nothing.
    expect(vm.runInContext('TourKit.interpolate("hi {{name}}", {})', realm().ctx)).toBe('hi ')
  })

  it('runs a target-less tour with no DOM at all', async () => {
    const { createTourEngine, createMemoryStorage } = realm().TourKit
    const engine = createTourEngine({
      tours: [TARGETLESS_TOUR],
      storage: createMemoryStorage(),
    })
    await engine.start('t')
    await engine.next()
    expect(engine.getState().currentStep?.id).toBe('s2')
    engine.destroy()
  })
})
