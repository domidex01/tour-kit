// @vitest-environment node
import { describe, expect, it } from 'vitest'
import { DEFAULT_STRINGS, resolveStrings } from '../../core/strings'
import type { AiChatStrings } from '../../types'

describe('DEFAULT_STRINGS', () => {
  it('has all required string keys', () => {
    const requiredKeys: (keyof AiChatStrings)[] = [
      'placeholder',
      'send',
      'errorMessage',
      'emptyState',
      'stopGenerating',
      'title',
      'closeLabel',
    ]
    for (const key of requiredKeys) {
      expect(DEFAULT_STRINGS).toHaveProperty(key)
      expect(typeof DEFAULT_STRINGS[key]).toBe('string')
    }
  })

  it('has non-empty values for all keys', () => {
    for (const [key, value] of Object.entries(DEFAULT_STRINGS)) {
      expect(value, `${key} should not be empty`).not.toBe('')
    }
  })

  it('has English defaults that mirror the shipped UI literals', () => {
    expect(DEFAULT_STRINGS.placeholder).toBe('Type a message...')
    expect(DEFAULT_STRINGS.send).toBe('Send message')
    expect(DEFAULT_STRINGS.errorMessage).toBe('Something went wrong. Please try again.')
    expect(DEFAULT_STRINGS.emptyState).toBe('Ask me anything!')
    expect(DEFAULT_STRINGS.title).toBe('AI Assistant')
  })
})

describe('resolveStrings', () => {
  it('returns all defaults when no partial provided', () => {
    const strings = resolveStrings()
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('returns all defaults when undefined is passed', () => {
    const strings = resolveStrings(undefined)
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('returns a new object (not the same reference as DEFAULT_STRINGS)', () => {
    const strings = resolveStrings()
    expect(strings).not.toBe(DEFAULT_STRINGS)
  })

  it('overrides a single field while keeping all other defaults', () => {
    const strings = resolveStrings({ placeholder: 'Custom placeholder' })
    expect(strings.placeholder).toBe('Custom placeholder')
    expect(strings.send).toBe('Send message')
    expect(strings.errorMessage).toBe('Something went wrong. Please try again.')
    expect(strings.emptyState).toBe('Ask me anything!')
    expect(strings.stopGenerating).toBe('Stop generating')
    expect(strings.title).toBe('AI Assistant')
    expect(strings.closeLabel).toBe('Close chat')
  })

  it('overrides multiple fields simultaneously', () => {
    const strings = resolveStrings({
      placeholder: 'Type here...',
      send: 'Submit',
      title: 'Help',
    })
    expect(strings.placeholder).toBe('Type here...')
    expect(strings.send).toBe('Submit')
    expect(strings.title).toBe('Help')
    expect(strings.errorMessage).toBe(DEFAULT_STRINGS.errorMessage)
    expect(strings.emptyState).toBe(DEFAULT_STRINGS.emptyState)
  })

  it('overrides all fields at once', () => {
    const custom: AiChatStrings = {
      placeholder: 'p',
      send: 's',
      errorMessage: 'e',
      emptyState: 'em',
      stopGenerating: 'sg',
      title: 't',
      closeLabel: 'cl',
    }
    const strings = resolveStrings(custom)
    expect(strings).toEqual(custom)
  })

  it('empty partial object returns all defaults', () => {
    const strings = resolveStrings({})
    expect(strings).toEqual(DEFAULT_STRINGS)
  })

  it('does not mutate DEFAULT_STRINGS when overriding', () => {
    const originalPlaceholder = DEFAULT_STRINGS.placeholder
    resolveStrings({ placeholder: 'Modified' })
    expect(DEFAULT_STRINGS.placeholder).toBe(originalPlaceholder)
  })
})
