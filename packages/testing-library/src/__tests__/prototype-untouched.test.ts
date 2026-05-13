import { beforeAll, describe, expect, it } from 'vitest'
import { setupTourKitTesting } from '../setup'

let baseline: PropertyDescriptor | undefined

beforeAll(() => {
  baseline = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')
})

describe('default setup — prototype untouched', () => {
  it('Element.prototype.getBoundingClientRect descriptor matches the JSDOM baseline after setupTourKitTesting()', async () => {
    await setupTourKitTesting()
    const after = Object.getOwnPropertyDescriptor(Element.prototype, 'getBoundingClientRect')
    expect(after?.value).toBe(baseline?.value)
    expect(after?.get).toBe(baseline?.get)
    expect(after?.set).toBe(baseline?.set)
  })
})
