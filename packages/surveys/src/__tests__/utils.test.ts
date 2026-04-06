import { describe, expect, it } from 'vitest'
import { cn } from '../lib/utils'

describe('cn() utility', () => {
  it('merges multiple class strings', () => {
    const result = cn('px-2', 'py-1', 'text-sm')
    expect(result).toBe('px-2 py-1 text-sm')
  })

  it('resolves Tailwind conflicts with last-wins', () => {
    const result = cn('px-2 py-1', 'px-4')
    expect(result).toBe('py-1 px-4')
  })

  it('handles conditional classes via clsx syntax', () => {
    const isActive = true
    const isDisabled = false
    const result = cn('base', isActive && 'active', isDisabled && 'disabled')
    expect(result).toBe('base active')
  })

  it('returns empty string for no input', () => {
    const result = cn()
    expect(result).toBe('')
  })
})
