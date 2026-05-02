import { describe, expect, it, vi } from 'vitest'
import { type FlowSessionV1, isExpired, parse, serialize } from '../../lib/flow-session'

const validSession: FlowSessionV1 = {
  schemaVersion: 1,
  tourId: 'onboarding',
  stepIndex: 2,
  startedAt: 1_700_000_000_000,
  lastUpdatedAt: 1_700_000_005_000,
}

describe('flow-session: serialize / parse', () => {
  it('round-trips a valid session', () => {
    const raw = serialize(validSession)
    const parsed = parse(raw)
    expect(parsed).toEqual(validSession)
  })

  it.each<[label: string, raw: string | null]>([
    ['null raw', null],
    ['empty string', ''],
    ['invalid JSON', '{not-json'],
    ['missing tourId', JSON.stringify({ ...validSession, tourId: undefined })],
    ['negative stepIndex', JSON.stringify({ ...validSession, stepIndex: -1 })],
    ['wrong schemaVersion', JSON.stringify({ ...validSession, schemaVersion: 99 })],
  ])('parse(%s) returns null without throwing', (_label, raw) => {
    expect(() => parse(raw)).not.toThrow()
    expect(parse(raw)).toBeNull()
  })
})

describe('flow-session: isExpired', () => {
  it('returns false when ttlMs <= 0 (never expires)', () => {
    expect(isExpired(validSession, 0)).toBe(false)
    expect(isExpired(validSession, -1)).toBe(false)
  })

  it('returns false when lastUpdatedAt is fresh', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(validSession.lastUpdatedAt + 100))
    try {
      expect(isExpired(validSession, 60 * 60 * 1000)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns true when lastUpdatedAt is older than ttlMs', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(validSession.lastUpdatedAt + 10_000))
    try {
      expect(isExpired(validSession, 1_000)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
