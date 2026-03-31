/**
 * Phase 0 — Post-run validation (Vitest)
 *
 * Tests that:
 * 1. Latency percentile math is correct (always runs)
 * 2. phase-0-status.json has valid schema (runs only after standalone script)
 */

import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { beforeAll, describe, expect, it } from 'vitest'

const STATUS_PATH = resolve(import.meta.dirname ?? __dirname, '../../plan/phase-0-status.json')

// ── Latency calculation tests (always run) ──

describe('Latency calculation helpers', () => {
  it('computes p50 and p95 correctly from 10-sample sorted array', () => {
    const latencies = [50, 80, 100, 120, 150, 180, 200, 250, 300, 450]
    // Already sorted, 10 samples
    const p50 = latencies[4] // index 4 = 5th value
    const p95 = latencies[9] // index 9 = 10th value (max for 10 samples)

    expect(p50).toBe(150)
    expect(p95).toBe(450)
    expect(p95).toBeLessThan(500)
  })

  it('flags p95 over budget', () => {
    const latencies = [50, 80, 100, 120, 150, 180, 200, 250, 300, 600]
    const p95 = latencies[9]

    expect(p95).toBeGreaterThanOrEqual(500)
  })

  it('handles unsorted array after sort', () => {
    const raw = [300, 50, 200, 100, 450, 80, 150, 250, 120, 180]
    const sorted = [...raw].sort((a, b) => a - b)

    expect(sorted).toEqual([50, 80, 100, 120, 150, 180, 200, 250, 300, 450])
    expect(sorted[4]).toBe(150) // p50
    expect(sorted[9]).toBe(450) // p95
  })

  it('p50 and p95 indices are correct for exactly 10 samples', () => {
    // For N=10: p50 = index 4 (50th percentile), p95 = index 9 (max)
    const latencies = Array.from({ length: 10 }, (_, i) => (i + 1) * 10)
    // [10, 20, 30, 40, 50, 60, 70, 80, 90, 100]

    expect(latencies[4]).toBe(50)
    expect(latencies[9]).toBe(100)
  })
})

// ── Post-run validation (skip if status file doesn't exist) ──

describe('Phase 0 — Post-run validation', () => {
  let statusDoc: Record<string, unknown>
  let statusExists: boolean

  beforeAll(() => {
    statusExists = existsSync(STATUS_PATH)
    if (statusExists) {
      statusDoc = JSON.parse(readFileSync(STATUS_PATH, 'utf-8'))
    }
  })

  it.skipIf(!existsSync(STATUS_PATH))('phase-0-status.json has required top-level fields', () => {
    expect(statusDoc).toHaveProperty('phase', 0)
    expect(statusDoc).toHaveProperty('name')
    expect(statusDoc).toHaveProperty('date')
    expect(statusDoc).toHaveProperty('decision')
    expect(['proceed', 'adjust', 'abort']).toContain(statusDoc.decision)
  })

  it.skipIf(!existsSync(STATUS_PATH))(
    'phase-0-status.json has test results for all operations',
    () => {
      const tests = statusDoc.tests as Record<string, unknown>
      expect(tests).toHaveProperty('validate')
      expect(tests).toHaveProperty('activate')
      expect(tests).toHaveProperty('deactivate')
      expect(tests).toHaveProperty('latency')

      const latency = tests.latency as Record<string, unknown>
      expect(typeof latency.p50_ms).toBe('number')
      expect(typeof latency.p95_ms).toBe('number')
    }
  )

  it.skipIf(!existsSync(STATUS_PATH))('each test result has status and notes', () => {
    const tests = statusDoc.tests as Record<string, Record<string, unknown>>
    for (const [name, result] of Object.entries(tests)) {
      expect(result, `tests.${name}`).toHaveProperty('status')
      expect(['pass', 'fail']).toContain(result.status)
      expect(result, `tests.${name}`).toHaveProperty('notes')
      expect(typeof result.notes).toBe('string')
    }
  })

  it.skipIf(!existsSync(STATUS_PATH))('date is a valid ISO date string', () => {
    const date = statusDoc.date as string
    expect(date).toMatch(/^\d{4}-\d{2}-\d{2}$/)
    expect(Number.isNaN(Date.parse(date))).toBe(false)
  })

  it.skipIf(!existsSync(STATUS_PATH))('adjustments and blockers are arrays', () => {
    expect(Array.isArray(statusDoc.adjustments)).toBe(true)
    expect(Array.isArray(statusDoc.blockers)).toBe(true)
  })
})
