import { describe, expect, it } from 'vitest'
import { virtualTarget } from '../helpers/virtual-target'

describe('virtualTarget', () => {
  it('default rect has non-zero width and height', () => {
    const rect = virtualTarget().getBoundingClientRect()
    expect(rect.width).toBeGreaterThan(0)
    expect(rect.height).toBeGreaterThan(0)
  })

  it('merges a partial rect, overriding defaults', () => {
    const rect = virtualTarget({ width: 500, top: 50 }).getBoundingClientRect()
    expect(rect.width).toBe(500)
    expect(rect.top).toBe(50)
    // Unspecified fields fall back to the default rect.
    expect(rect.height).toBe(100)
  })

  it('returns a DOMRect-shaped object', () => {
    const rect = virtualTarget({ width: 42 }).getBoundingClientRect()
    for (const key of ['x', 'y', 'top', 'left', 'right', 'bottom', 'width', 'height'] as const) {
      expect(rect[key]).toBeTypeOf('number')
    }
    expect(typeof rect.toJSON).toBe('function')
  })

  it('attaches contextElement when provided', () => {
    const el = document.createElement('div')
    const target = virtualTarget({}, el)
    expect(target.contextElement).toBe(el)
  })
})
