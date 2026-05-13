import { describe, expect, it } from 'vitest'
import { calculateFunnelMetrics } from '../calculate-funnel-metrics'

describe('calculateFunnelMetrics', () => {
  it('returns empty array on empty input', () => {
    expect(calculateFunnelMetrics([])).toEqual([])
  })

  it('first step has retentionFromPrev=1 and dropoffFromPrev=0', () => {
    const [m] = calculateFunnelMetrics([{ id: 'a', label: 'A', entered: 50 }])
    expect(m?.retentionFromPrev).toBe(1)
    expect(m?.dropoffFromPrev).toBe(0)
  })

  it('two-step retention/dropoff computed correctly', () => {
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 100, completed: 60 },
      { id: 'b', label: 'B', entered: 40, completed: 10 },
    ])
    expect(m[0]?.conversion).toBeCloseTo(0.6)
    expect(m[1]?.retentionFromPrev).toBeCloseTo(0.4)
    expect(m[1]?.dropoffFromPrev).toBe(60)
    expect(m[1]?.conversion).toBeCloseTo(0.25)
  })

  it('does not produce NaN/Infinity when first step has entered=0', () => {
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 0 },
      { id: 'b', label: 'B', entered: 0 },
    ])
    expect(Number.isFinite(m[0]?.conversion ?? 0)).toBe(true)
    expect(Number.isFinite(m[1]?.retentionFromPrev ?? 0)).toBe(true)
    expect(m[0]?.conversion).toBe(0)
    expect(m[1]?.retentionFromPrev).toBe(0)
  })

  it('handles missing completed (defaults to 0)', () => {
    const [m] = calculateFunnelMetrics([{ id: 'a', label: 'A', entered: 10 }])
    expect(m?.completed).toBe(0)
    expect(m?.conversion).toBe(0)
  })

  it('clamps negative drop-off to 0 when a later step has more entered than the previous', () => {
    // Should not happen in a real funnel, but the helper must not emit negatives.
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 10 },
      { id: 'b', label: 'B', entered: 20 },
    ])
    expect(m[1]?.dropoffFromPrev).toBe(0)
  })

  it('handles large numbers without precision drift in retention', () => {
    const m = calculateFunnelMetrics([
      { id: 'a', label: 'A', entered: 1_000_000, completed: 500_000 },
      { id: 'b', label: 'B', entered: 250_000 },
    ])
    expect(m[0]?.conversion).toBeCloseTo(0.5)
    expect(m[1]?.retentionFromPrev).toBeCloseTo(0.25)
  })
})
