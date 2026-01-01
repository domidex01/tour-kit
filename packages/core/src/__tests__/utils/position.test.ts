import { describe, expect, it } from 'vitest'
import {
  calculatePosition,
  getOppositeSide,
  getViewportDimensions,
  parsePlacement,
  wouldOverflow,
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

  describe('calculatePosition', () => {
    const targetRect = { x: 100, y: 100, width: 100, height: 50 }
    const tooltipSize = { width: 200, height: 100 }

    it('calculates bottom center position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'bottom')
      expect(position.y).toBe(150) // 100 + 50
      expect(position.x).toBe(50) // 100 + (100 - 200) / 2
    })

    it('calculates top center position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'top')
      expect(position.y).toBe(0) // 100 - 100
      expect(position.x).toBe(50)
    })

    it('calculates left center position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'left')
      expect(position.x).toBe(-100) // 100 - 200
      expect(position.y).toBe(75) // 100 + (50 - 100) / 2
    })

    it('calculates right center position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'right')
      expect(position.x).toBe(200) // 100 + 100
      expect(position.y).toBe(75)
    })

    it('calculates bottom-start position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'bottom-start')
      expect(position.y).toBe(150)
      expect(position.x).toBe(100) // aligned to start
    })

    it('calculates bottom-end position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'bottom-end')
      expect(position.y).toBe(150)
      expect(position.x).toBe(0) // 100 + 100 - 200
    })

    it('applies offset correctly', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'bottom', [10, 20])
      expect(position.y).toBe(170) // 150 + 20
      expect(position.x).toBe(60) // 50 + 10
    })

    it('calculates left-start position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'left-start')
      expect(position.x).toBe(-100) // 100 - 200
      expect(position.y).toBe(100) // aligned to start of target
    })

    it('calculates left-end position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'left-end')
      expect(position.x).toBe(-100) // 100 - 200
      expect(position.y).toBe(50) // 100 + 50 - 100 (target.y + target.height - tooltip.height)
    })

    it('calculates right-start position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'right-start')
      expect(position.x).toBe(200) // 100 + 100
      expect(position.y).toBe(100) // aligned to start of target
    })

    it('calculates right-end position', () => {
      const position = calculatePosition(targetRect, tooltipSize, 'right-end')
      expect(position.x).toBe(200) // 100 + 100
      expect(position.y).toBe(50) // 100 + 50 - 100 (target.y + target.height - tooltip.height)
    })
  })

  describe('wouldOverflow', () => {
    const viewport = { width: 1000, height: 800 }
    const dimensions = { width: 200, height: 100 }

    it('detects no overflow', () => {
      const overflow = wouldOverflow({ x: 100, y: 100 }, dimensions, viewport)
      expect(overflow).toEqual({
        top: false,
        right: false,
        bottom: false,
        left: false,
      })
    })

    it('detects left overflow', () => {
      const overflow = wouldOverflow({ x: -50, y: 100 }, dimensions, viewport)
      expect(overflow.left).toBe(true)
      expect(overflow.right).toBe(false)
    })

    it('detects right overflow', () => {
      const overflow = wouldOverflow({ x: 900, y: 100 }, dimensions, viewport)
      expect(overflow.right).toBe(true)
      expect(overflow.left).toBe(false)
    })

    it('detects top overflow', () => {
      const overflow = wouldOverflow({ x: 100, y: -50 }, dimensions, viewport)
      expect(overflow.top).toBe(true)
      expect(overflow.bottom).toBe(false)
    })

    it('detects bottom overflow', () => {
      const overflow = wouldOverflow({ x: 100, y: 750 }, dimensions, viewport)
      expect(overflow.bottom).toBe(true)
      expect(overflow.top).toBe(false)
    })

    it('detects multiple overflows', () => {
      const overflow = wouldOverflow({ x: -50, y: -50 }, dimensions, viewport)
      expect(overflow.left).toBe(true)
      expect(overflow.top).toBe(true)
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
