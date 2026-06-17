/**
 * Slice 0 — Credibility Surface: verify the position-helper cut.
 *
 * `utils/position.ts` was half-dead: lines 1-102 are live RTL/placement helpers
 * used in production; lines 104-321 were a hand-rolled collision engine that was
 * barrel-private and contradicted the docs (which describe helpers, not an
 * engine). Slice 0 deleted the engine and KEPT the helpers.
 *
 * This double-guards the cut:
 *   (a) PRESENCE — the 8 live helpers (with `getDocumentDirection` as the named
 *       canary the brief calls out) still export from the package + utils barrel.
 *   (b) ABSENCE — the 6 dead engine symbols are not on the public surface AND no
 *       longer appear anywhere in `position.ts` source (catches the bare,
 *       never-exported `shiftPositionIntoViewport` too).
 *
 * The sibling `barrel-utils.test.ts` / `barrel-exports.test.ts` already assert
 * the named-export absence and stay UNCHANGED — this file adds the presence side
 * and the source-text scan.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import * as core from '../index'
import * as utils from '../utils'

const LIVE_HELPERS = [
  'getDocumentDirection', // ← canary: first to break if the cut takes 1-102 by mistake
  'mirrorSide',
  'mirrorAlignment',
  'mirrorPlacementForRTL',
  'getElementRect',
  'getViewportDimensions',
  'parsePlacement',
  'getOppositeSide',
] as const

const DEAD_ENGINE = [
  'calculatePosition',
  'calculatePositionWithCollision',
  'wouldOverflow',
  'getFallbackPlacements',
  'PositionResult',
  'shiftPositionIntoViewport',
] as const

describe('position surface — live helpers survive the cut', () => {
  it.each(LIVE_HELPERS)('utils barrel still exports %s as a function', (name) => {
    expect(typeof (utils as Record<string, unknown>)[name]).toBe('function')
  })

  it.each(LIVE_HELPERS)('package barrel still exports %s as a function', (name) => {
    expect(typeof (core as Record<string, unknown>)[name]).toBe('function')
  })
})

describe('position surface — dead engine is gone from the public surface', () => {
  it.each(DEAD_ENGINE)('utils barrel does not export %s', (name) => {
    expect(utils).not.toHaveProperty(name)
  })

  it.each(DEAD_ENGINE)('package barrel does not export %s', (name) => {
    expect(core).not.toHaveProperty(name)
  })
})

describe('position surface — dead engine is gone from position.ts source', () => {
  const positionSrc = readFileSync(
    join(dirname(fileURLToPath(import.meta.url)), '..', 'utils', 'position.ts'),
    'utf8'
  )

  it.each(DEAD_ENGINE)('position.ts no longer declares %s', (name) => {
    // Bare name scan (not just `export`) so the never-exported
    // `shiftPositionIntoViewport` is caught alongside the rest.
    expect(positionSrc).not.toMatch(new RegExp(`\\b${name}\\b`))
  })
})
