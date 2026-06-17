import { describe, expect, it } from 'vitest'
import {
  getOppositeSide,
  getViewportDimensions,
  parsePlacement,
} from '../../utils/position'

describe('Position Utilities', () => {
  describe('parsePlacement', () => {
    it('parses simple side', () => {
      expect(parsePlacement('top')).toEqual({ side: 'top', alignment: 'center' })
      expect(parsePlacement('bottom')).toEqual({ side: 'bottom', alignment: 'center' })
      expect(parsePlacement('left')).toEqual({ side: 'left', alignment: 'center' })
      expect(parsePlacement('right')).toEqual({ side: 'right', alignment: 'center' })
    })

    it('parses side with alignment', () => {
      expect(parsePlacement('top-start')).toEqual({ side: 'top', alignment: 'start' })
      expect(parsePlacement('top-end')).toEqual({ side: 'top', alignment: 'end' })
      expect(parsePlacement('bottom-start')).toEqual({ side: 'bottom', alignment: 'start' })
      expect(parsePlacement('bottom-end')).toEqual({ side: 'bottom', alignment: 'end' })
      expect(parsePlacement('left-start')).toEqual({ side: 'left', alignment: 'start' })
      expect(parsePlacement('right-end')).toEqual({ side: 'right', alignment: 'end' })
    })
  })

  describe('getOppositeSide', () => {
    it('returns opposite sides', () => {
      expect(getOppositeSide('top')).toBe('bottom')
      expect(getOppositeSide('bottom')).toBe('top')
      expect(getOppositeSide('left')).toBe('right')
      expect(getOppositeSide('right')).toBe('left')
    })
  })

  describe('getViewportDimensions', () => {
    it('returns viewport dimensions', () => {
      const dimensions = getViewportDimensions()
      expect(dimensions).toHaveProperty('width')
      expect(dimensions).toHaveProperty('height')
      expect(typeof dimensions.width).toBe('number')
      expect(typeof dimensions.height).toBe('number')
    })
  })
})
