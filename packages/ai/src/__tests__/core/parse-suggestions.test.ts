import { describe, expect, it } from 'vitest'
import { parseSuggestions } from '../../core/suggestion-engine'

describe('parseSuggestions', () => {
  it('splits multi-line text into string array', () => {
    const text = 'Question 1\nQuestion 2\nQuestion 3'
    expect(parseSuggestions(text, 3)).toEqual(['Question 1', 'Question 2', 'Question 3'])
  })

  it('trims whitespace from each line', () => {
    const text = '  Question 1  \n  Question 2  '
    expect(parseSuggestions(text, 3)).toEqual(['Question 1', 'Question 2'])
  })

  it('strips numbered prefixes like "1. " and "1) "', () => {
    const text = '1. First question\n2. Second question\n3) Third question'
    expect(parseSuggestions(text, 3)).toEqual([
      'First question',
      'Second question',
      'Third question',
    ])
  })

  it('strips bullet prefixes like "- " and "* "', () => {
    const text = '- First question\n* Second question\n- Third question'
    expect(parseSuggestions(text, 3)).toEqual([
      'First question',
      'Second question',
      'Third question',
    ])
  })

  it('strips surrounding quotes from suggestions', () => {
    const text = '"How do I export?"\n\'What plans are available?\''
    expect(parseSuggestions(text, 3)).toEqual(['How do I export?', 'What plans are available?'])
  })

  it('filters out empty lines', () => {
    const text = 'Question 1\n\n\nQuestion 2\n\nQuestion 3'
    expect(parseSuggestions(text, 3)).toEqual(['Question 1', 'Question 2', 'Question 3'])
  })

  it('returns at most count results', () => {
    const text = 'Q1\nQ2\nQ3\nQ4\nQ5'
    expect(parseSuggestions(text, 3)).toEqual(['Q1', 'Q2', 'Q3'])
  })

  it('handles response with mixed formatting (numbers + bullets)', () => {
    const text = '1. First\n- Second\n* Third'
    expect(parseSuggestions(text, 3)).toEqual(['First', 'Second', 'Third'])
  })

  it('returns empty array for empty string input', () => {
    expect(parseSuggestions('', 3)).toEqual([])
  })

  it('handles single-line response', () => {
    expect(parseSuggestions('How do I get started?', 3)).toEqual(['How do I get started?'])
  })
})
