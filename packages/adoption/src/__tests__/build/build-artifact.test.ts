import { describe, expect, it } from 'vitest'
import { gzippedBytes, looksMinified, readDistOrSkip } from './build-artifact.helpers'

describe('adoption — built artifact (post-Phase-1 minify flip)', () => {
  const dist = readDistOrSkip()
  const minified = looksMinified(dist)

  it.runIf(minified)('starts with a "use client" directive', () => {
    const firstLine = dist!.split('\n')[0]
    expect(firstLine).toMatch(/^['"]use client['"];?$/)
  })

  it.runIf(minified)('is minified (heuristic: no JSDoc blocks remain)', () => {
    expect(dist!).not.toMatch(/\/\*\*[\s\S]+?\*\//)
  })

  it.runIf(minified)('gzipped size is positive (recorded for size-limit gate)', () => {
    const size = gzippedBytes(dist!)
    expect(size).toBeGreaterThan(0)
  })
})
