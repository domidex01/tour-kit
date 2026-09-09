// @vitest-environment node
/**
 * v3 Phase 1 — the engine with no `window` at all.
 *
 * A real `node` environment rather than a `window` stub: the claim is that
 * nothing in the construct → drive → boot → destroy path reads a DOM global,
 * and a stub with `window` present makes that claim untestable. The docblock is
 * FILE-scoped; one further down does nothing and the file runs in jsdom.
 */
import { describe, expect, it } from 'vitest'
import { createHintsEngine } from '../create-hints-engine'

describe('createHintsEngine under SSR', () => {
  it('constructs, registers, shows, boots, dismisses and destroys without a window', () => {
    expect(typeof globalThis.window, 'this file is not running in node').toBe('undefined')

    const e = createHintsEngine()
    expect(() => {
      e.setHints([{ id: 'a', frequency: 'once' }, { id: 'b' }])
      e.showHint('a')
    }).not.toThrow()
    expect(e.getState().activeHint).toBe('a')

    expect(() => e.boot()).not.toThrow()
    // No window means no default storage, so nothing was persisted and the
    // frequency gate has nothing to hydrate.
    expect(e.getState().frequencyState.get('a')?.viewCount).toBe(1)

    e.dismissHint('a')
    expect(e.getState().activeHint).toBeNull()
    expect(e.getState().hints.get('a')?.isDismissed).toBe(true)

    expect(() => e.destroy()).not.toThrow()
  })
})
