import { describe, expect, it } from 'vitest'
import * as core from '../index'

describe('@tour-kit/core barrel', () => {
  it('exports cn at the top level', () => {
    expect(typeof core.cn).toBe('function')
  })
})
