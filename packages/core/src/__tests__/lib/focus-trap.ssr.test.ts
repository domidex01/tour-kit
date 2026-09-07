// @vitest-environment node
/**
 * v2 §1.3b-1 — `createFocusTrap` on the server.
 *
 * `useFocusTrap` builds its trap in a `useMemo`, which runs during a server
 * render. The pragma is file-scoped, which is why this cannot live inside
 * `focus-trap.test.ts` — the same reason §1.3 split `create-tour-engine.ssr.test.ts`.
 */
import { describe, expect, it } from 'vitest'
import { createFocusTrap } from '../../lib/focus-trap'

describe('createFocusTrap with no document', () => {
  it('constructs and every method is a no-op', () => {
    expect(typeof document).toBe('undefined')

    const trap = createFocusTrap(() => null, { inertBackground: true })

    expect(() => {
      trap.capture()
      trap.activate()
      trap.forget()
      trap.deactivate()
      trap.release()
    }).not.toThrow()
  })
})
