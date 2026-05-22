import { describe, expect, it } from 'vitest'
import * as utilsBarrel from '../../utils'

describe('@tour-kit/core/utils barrel — Phase 3 dead position exports', () => {
  it.each([
    'calculatePosition',
    'calculatePositionWithCollision',
    'wouldOverflow',
    'getFallbackPlacements',
    'PositionResult',
  ])('does not export %s', (name) => {
    expect(utilsBarrel).not.toHaveProperty(name)
  })

  it('STILL exports neighbours that share the file (parsePlacement, getOppositeSide)', () => {
    // These are surviving exports from utils/position.ts. The Phase 3 cut is
    // scoped to the dead public-API names — these helpers are still public.
    expect(typeof utilsBarrel.parsePlacement).toBe('function')
    expect(typeof utilsBarrel.getOppositeSide).toBe('function')
  })
})
