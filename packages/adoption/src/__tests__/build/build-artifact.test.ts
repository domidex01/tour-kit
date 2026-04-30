import { describe, expect, it } from 'vitest'
import { classifyDist, gzippedBytes, readDistOrSkip } from './build-artifact.helpers'

describe('adoption — built artifact (post-Phase-1 minify flip)', () => {
  const dist = readDistOrSkip()
  const state = classifyDist(dist)
  const present = state !== 'missing'

  it.runIf(present)('starts with a "use client" directive', () => {
    expect(dist!.split('\n')[0]).toMatch(/^['"]use client['"];?$/)
  })

  it.runIf(present)('is minified (heuristic: under 200 lines)', () => {
    expect(state).toBe('minified')
  })

  it.runIf(present)('has no JSDoc blocks remaining (minify removed them)', () => {
    expect(dist!).not.toMatch(/\/\*\*[\s\S]+?\*\//)
  })

  it.runIf(present)('gzipped size is positive (recorded for size-limit gate)', () => {
    expect(gzippedBytes(dist!)).toBeGreaterThan(0)
  })
})
