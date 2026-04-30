import { describe, expect, it } from 'vitest'
import { cn } from '../utils'

describe('cn() — canonical merge utility', () => {
  describe('Tailwind class de-duplication (replaces 8 prior implementations)', () => {
    it.each([
      ['later padding wins', ['p-2', 'p-4'], 'p-4'],
      ['later color wins', ['text-red-500', 'text-blue-500'], 'text-blue-500'],
      ['no conflict — both kept', ['p-4', 'm-2'], 'p-4 m-2'],
      ['mixed conflict + non-conflict', ['p-2 m-2', 'p-4'], 'm-2 p-4'],
    ])('%s', (_label, inputs, expected) => {
      expect(cn(...inputs)).toBe(expected)
    })
  })

  describe('Falsy / conditional inputs (clsx contract)', () => {
    it('skips false, null, undefined, 0', () => {
      expect(cn('a', false, null, undefined, 0, 'b')).toBe('a b')
    })

    it('handles object syntax: { class: condition }', () => {
      expect(cn('base', { active: true, disabled: false })).toBe('base active')
    })

    it('handles array syntax', () => {
      expect(cn(['a', 'b'], ['c'])).toBe('a b c')
    })
  })

  describe('Output type', () => {
    it('always returns a string', () => {
      expect(typeof cn()).toBe('string')
      expect(typeof cn('a')).toBe('string')
      expect(cn()).toBe('')
    })
  })
})
