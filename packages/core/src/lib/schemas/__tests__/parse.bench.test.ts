import { describe, expect, it } from 'vitest'
import { parseTourDefinition } from '../parse'
import { validFiveSteps } from './_inputs'

/**
 * Micro-bench for `parseTourDefinition`. Spec target: median <5ms over 100
 * iterations for a 5-step tour. We use a regular `it()` + `performance.now()`
 * (not `vitest bench`) for a deterministic threshold assertion that fails
 * loudly in CI when the parser regresses, regardless of runner config.
 */
describe('parseTourDefinition — performance', () => {
  it('parses a 5-step tour with median <5ms over 100 iterations', () => {
    // Warm-up — JIT/inline-cache primer; avoids skewed first-call timings.
    for (let i = 0; i < 5; i += 1) parseTourDefinition(validFiveSteps)

    const samples: number[] = []
    for (let i = 0; i < 100; i += 1) {
      const start = performance.now()
      parseTourDefinition(validFiveSteps)
      samples.push(performance.now() - start)
    }

    samples.sort((a, b) => a - b)
    const median = samples[50] ?? Number.POSITIVE_INFINITY
    expect(median).toBeLessThan(5)
  })
})
