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
      'retry',
      'title',
      'closeLabel',
      'ratePositiveLabel',
      'rateNegativeLabel',
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

  it('has English defaults', () => {
    expect(DEFAULT_STRINGS.placeholder).toBe('Ask a question...')
    expect(DEFAULT_STRINGS.send).toBe('Send')
    expect(DEFAULT_STRINGS.errorMessage).toBe('Something went wrong. Please try again.')
    expect(DEFAULT_STRINGS.emptyState).toBe('How can I help you?')
    expect(DEFAULT_STRINGS.title).toBe('Chat')
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
    expect(strings.send).toBe('Send')
    expect(strings.errorMessage).toBe('Something went wrong. Please try again.')
    expect(strings.emptyState).toBe('How can I help you?')
    expect(strings.stopGenerating).toBe('Stop generating')
    expect(strings.retry).toBe('Retry')
    expect(strings.title).toBe('Chat')
    expect(strings.closeLabel).toBe('Close chat')
    expect(strings.ratePositiveLabel).toBe('Helpful')
    expect(strings.rateNegativeLabel).toBe('Not helpful')
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
    expect(strings.retry).toBe(DEFAULT_STRINGS.retry)
  })

  it('overrides all fields at once', () => {
    const custom: AiChatStrings = {
      placeholder: 'p',
      send: 's',
      errorMessage: 'e',
      emptyState: 'em',
      stopGenerating: 'sg',
      retry: 'r',
      title: 't',
      closeLabel: 'cl',
      ratePositiveLabel: 'rp',
      rateNegativeLabel: 'rn',
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
