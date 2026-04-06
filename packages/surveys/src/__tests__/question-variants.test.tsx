import { describe, expect, it } from 'vitest'
import {
  ratingOptionVariants,
  textInputVariants,
  selectOptionVariants,
  booleanOptionVariants,
  progressBarVariants,
} from '../components/ui/question-variants'

describe('ratingOptionVariants', () => {
  it('should return default classes', () => {
    const result = ratingOptionVariants()
    expect(result).toContain('inline-flex')
    expect(result).toContain('h-10')
    expect(result).toContain('w-10')
    expect(result).toContain('rounded-md')
    expect(result).toContain('font-medium')
  })

  it('should return selected classes', () => {
    const result = ratingOptionVariants({ selected: true })
    expect(result).toContain('bg-primary')
    expect(result).toContain('text-primary-foreground')
  })

  it('should return size sm classes', () => {
    const result = ratingOptionVariants({ size: 'sm' })
    expect(result).toContain('h-8')
    expect(result).toContain('w-8')
    expect(result).toContain('text-sm')
  })

  it('should return stars style classes', () => {
    const result = ratingOptionVariants({ style: 'stars' })
    expect(result).toContain('rounded-full')
    expect(result).not.toContain('font-medium')
  })
})

describe('textInputVariants', () => {
  it('should return default classes', () => {
    const result = textInputVariants()
    expect(result).toContain('flex')
    expect(result).toContain('w-full')
    expect(result).toContain('rounded-md')
    expect(result).toContain('h-10')
  })

  it('should return lg size classes', () => {
    const result = textInputVariants({ size: 'lg' })
    expect(result).toContain('h-12')
    expect(result).toContain('text-lg')
  })
})

describe('selectOptionVariants', () => {
  it('should return default classes', () => {
    const result = selectOptionVariants()
    expect(result).toContain('flex')
    expect(result).toContain('items-center')
    expect(result).toContain('rounded-md')
    expect(result).toContain('cursor-pointer')
  })

  it('should return selected classes', () => {
    const result = selectOptionVariants({ selected: true })
    expect(result).toContain('bg-primary/10')
    expect(result).toContain('border-primary')
  })

  it('should return disabled classes', () => {
    const result = selectOptionVariants({ disabled: true })
    expect(result).toContain('cursor-not-allowed')
    expect(result).toContain('opacity-50')
  })
})

describe('booleanOptionVariants', () => {
  it('should return default classes', () => {
    const result = booleanOptionVariants()
    expect(result).toContain('inline-flex')
    expect(result).toContain('rounded-md')
    expect(result).toContain('font-medium')
  })

  it('should return selected classes', () => {
    const result = booleanOptionVariants({ selected: true })
    expect(result).toContain('bg-primary')
    expect(result).toContain('text-primary-foreground')
  })
})

describe('progressBarVariants', () => {
  it('should return default classes', () => {
    const result = progressBarVariants()
    expect(result).toContain('h-2')
    expect(result).toContain('rounded-full')
    expect(result).toContain('bg-primary')
  })

  it('should return sm size class', () => {
    const result = progressBarVariants({ size: 'sm' })
    expect(result).toContain('h-1')
  })

  it('should return lg size class', () => {
    const result = progressBarVariants({ size: 'lg' })
    expect(result).toContain('h-3')
  })
})
