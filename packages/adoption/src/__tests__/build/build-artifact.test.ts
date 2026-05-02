import { describe, expect, it } from 'vitest'
import { classifyDist, gzippedBytes, readDistOrSkip } from './build-artifact.helpers'

describe('adoption — built artifact (post-Phase-1 minify flip)', () => {
  const dist = readDistOrSkip()
  const state = classifyDist(dist)
  const present = state !== 'missing'
  // Once `present` is true, `dist` is guaranteed defined; capture the
  // narrowed value once instead of asserting non-null at every use.
  const distContent = dist ?? ''

  it.runIf(present)('starts with a "use client" directive', () => {
    expect(distContent.split('\n')[0]).toMatch(/^['"]use client['"];?$/)
  })

  it.runIf(present)('is minified (heuristic: under 200 lines)', () => {
    expect(state).toBe('minified')
  })

  it.runIf(present)('has no JSDoc blocks remaining (minify removed them)', () => {
    expect(distContent).not.toMatch(/\/\*\*[\s\S]+?\*\//)
  })

  it.runIf(present)('gzipped size is positive (recorded for size-limit gate)', () => {
    expect(gzippedBytes(distContent)).toBeGreaterThan(0)
  })
})
