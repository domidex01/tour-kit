import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { resolveTarget } from '../../types/target'

describe('resolveTarget', () => {
  let savedDocument: typeof globalThis.document

  beforeEach(() => {
    savedDocument = globalThis.document
    document.body.innerHTML = '<div id="x">hello</div>'
  })

  afterEach(() => {
    // Restore the jsdom `document` reference first — the SSR test stubs it to
    // `undefined`, so any `document.*` access in cleanup would throw.
    vi.unstubAllGlobals()
    ;(globalThis as { document: typeof globalThis.document }).document = savedDocument
    document.body.innerHTML = ''
  })

  it('string selector → document.querySelector', () => {
    const el = document.getElementById('x')
    expect(resolveTarget('#x')).toBe(el)
  })

  it('RefObject with .current set → returns the element', () => {
    const el = document.getElementById('x')
    if (!el) throw new Error('fixture missing')
    expect(resolveTarget({ current: el })).toBe(el)
  })

  it('RefObject with .current null → returns null', () => {
    expect(resolveTarget({ current: null })).toBeNull()
  })

  it('thunk returning element → returns the element', () => {
    const el = document.getElementById('x')
    if (!el) throw new Error('fixture missing')
    expect(resolveTarget(() => el)).toBe(el)
  })

  it('thunk returning null → returns null', () => {
    expect(resolveTarget(() => null)).toBeNull()
  })

  it('SSR-safe: returns null when document is undefined and does NOT throw', () => {
    vi.stubGlobal('document', undefined)
    expect(() => resolveTarget('#x')).not.toThrow()
    expect(resolveTarget('#x')).toBeNull()
  })
})
