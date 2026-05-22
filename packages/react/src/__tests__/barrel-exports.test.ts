import { describe, expect, it } from 'vitest'
import * as reactBarrel from '../index'

describe('@tour-kit/react barrel — Phase 3 dead position exports', () => {
  it('does not export calculatePosition (removed from re-export list)', () => {
    expect(reactBarrel).not.toHaveProperty('calculatePosition')
  })

  it('STILL re-exports useElementPosition from core (companion API survives)', () => {
    expect(typeof reactBarrel.useElementPosition).toBe('function')
  })
})
