/**
 * Issue #154 — the no-drift half, made mechanical.
 *
 * The filer's second ask: "the provider should reuse the same engine
 * implementation that @tour-kit/core does, so the two bindings don't drift
 * apart again." v2 §1.4 did the restructuring (`<TourProvider>` is a binding
 * over `createTourEngine()`); this guard is what stops the drift from coming
 * back. If anyone reintroduces lifecycle handling into the React binding —
 * a stray `START_TOUR` dispatch, an `.onEnter` read, an `invokeCallback`
 * import — this fails before the second engine exists.
 *
 * Modeled on `step-callbacks-wired.test.ts` (#121): it reads the source,
 * because there is no behaviour to test for code that must never be written.
 * The self-checks matter for the same reason — a scan that silently stops
 * matching passes forever.
 */
import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const SRC = resolve(__dirname, '..', '..')

/** The React binding files that must stay thin over the engine. */
const BINDING_FILES = ['context/tour-provider.tsx', 'context/tourkit-provider.tsx'] as const

/**
 * Reducer action literals — dispatching one from a binding bypasses the
 * engine's transition effects (route persistence, cross-tab announce, the
 * #121 step notifications), which is precisely the drift this forbids.
 */
const ACTION_LITERALS = [
  'START_TOUR',
  'NEXT_STEP',
  'PREV_STEP',
  'COMPLETE_TOUR',
  'SKIP_TOUR',
  'STOP_TOUR',
  'RESET',
  'SET_TRANSITIONING',
  'TRACK_STEP_VISIT',
  'ADD_COMPLETED',
  'ADD_SKIPPED',
] as const

/**
 * Step- and tour-level callback reads. The engine owns every one of these
 * (`start-tour.ts`, `transition-effects.ts`, `actions.ts`); a binding that
 * reads them is deciding lifecycle policy, which is engine work.
 */
const LIFECYCLE_READS = [
  '.onBeforeShow',
  '.onBeforeHide',
  '.onEnter',
  '.onShow',
  '.onHide',
  '.onStart',
  '.onComplete',
  '.onSkip',
  '.onStepChange',
] as const

/** Engine-only helpers — importing one into a binding is the first step of a second engine. */
const ENGINE_ONLY_IMPORTS = ['invokeCallback', 'invokeAsyncCallback'] as const

function sourceOf(relPath: (typeof BINDING_FILES)[number]): string {
  const source = readFileSync(resolve(SRC, relPath), 'utf8')
  // Self-check: a moved/renamed file must not turn this guard into a no-op.
  expect(source.length, `${relPath} looks empty — did it move?`).toBeGreaterThan(1000)
  return source
}

describe('the React provider is a binding over the engine, not a second engine (#154)', () => {
  it('self-check: the binding still constructs the engine it is supposed to reuse', () => {
    const provider = sourceOf('context/tour-provider.tsx')
    expect(provider).toContain('createTourEngine(')
    expect(provider).toContain('createEngineHandle')
  })

  it.each([...ACTION_LITERALS])('tour-provider/tourkit-provider never dispatch `%s`', (action) => {
    for (const file of BINDING_FILES) {
      expect(
        sourceOf(file),
        `${file} dispatches \`${action}\` — that is engine work`
      ).not.toContain(`'${action}'`)
    }
  })

  it.each([...LIFECYCLE_READS])('the bindings never read `%s`', (key) => {
    for (const file of BINDING_FILES) {
      expect(
        sourceOf(file),
        `${file} reads \`${key}\` — lifecycle policy is engine work`
      ).not.toContain(key)
    }
  })

  it.each([...ENGINE_ONLY_IMPORTS])('the bindings never import `%s`', (symbol) => {
    for (const file of BINDING_FILES) {
      expect(
        sourceOf(file),
        `${file} imports \`${symbol}\` from the engine internals`
      ).not.toContain(symbol)
    }
  })
})
