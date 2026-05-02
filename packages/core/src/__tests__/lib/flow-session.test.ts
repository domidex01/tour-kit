import { describe, expect, it, vi } from 'vitest'
import {
  type FlowSessionV1,
  type FlowSessionV2,
  isExpired,
  parse,
  serialize,
} from '../../lib/flow-session'

const validV2: FlowSessionV2 = {
  schemaVersion: 2,
  tourId: 'onboarding',
  stepIndex: 2,
  startedAt: 1_700_000_000_000,
  lastUpdatedAt: 1_700_000_005_000,
}

const validV1: FlowSessionV1 = {
  schemaVersion: 1,
  tourId: 'onboarding',
  stepIndex: 2,
  startedAt: 1_700_000_000_000,
  lastUpdatedAt: 1_700_000_005_000,
}

describe('flow-session: serialize / parse (V2)', () => {
  it('round-trips a V2 session without currentRoute', () => {
    const raw = serialize(validV2)
    const parsed = parse(raw)
    expect(parsed).toEqual(validV2)
  })

  it('round-trips a V2 session with currentRoute (US-4)', () => {
    const v2WithRoute: FlowSessionV2 = { ...validV2, currentRoute: '/billing' }
    const raw = serialize(v2WithRoute)
    const parsed = parse(raw)
    expect(parsed).toEqual(v2WithRoute)
    expect(parsed?.currentRoute).toBe('/billing')
  })

  it.each<[label: string, raw: string | null]>([
    ['null raw', null],
    ['empty string', ''],
    ['invalid JSON', '{not-json'],
    ['missing tourId', JSON.stringify({ ...validV2, tourId: undefined })],
    ['negative stepIndex', JSON.stringify({ ...validV2, stepIndex: -1 })],
    ['unknown schemaVersion', JSON.stringify({ ...validV2, schemaVersion: 99 })],
    [
      'currentRoute wrong type',
      JSON.stringify({ ...validV2, currentRoute: 42 as unknown as string }),
    ],
  ])('parse(%s) returns null without throwing', (_label, raw) => {
    expect(() => parse(raw)).not.toThrow()
    expect(parse(raw)).toBeNull()
  })
})

describe('flow-session: V1 → V2 migration (US-4)', () => {
  it('migrates a V1 blob to V2 with currentRoute: undefined', () => {
    const raw = JSON.stringify(validV1)
    const parsed = parse(raw)

    expect(parsed).not.toBeNull()
    expect(parsed?.schemaVersion).toBe(2)
    expect(parsed?.currentRoute).toBeUndefined()
    // V1 fields preserved
    expect(parsed?.tourId).toBe(validV1.tourId)
    expect(parsed?.stepIndex).toBe(validV1.stepIndex)
    expect(parsed?.startedAt).toBe(validV1.startedAt)
    expect(parsed?.lastUpdatedAt).toBe(validV1.lastUpdatedAt)
  })

  it('migrated V2 session is re-serializable round-trip', () => {
    const raw = JSON.stringify(validV1)
    const parsed = parse(raw)
    expect(parsed).not.toBeNull()
    const reSerialized = serialize(parsed as FlowSessionV2)
    const reParsed = parse(reSerialized)
    expect(reParsed).toEqual(parsed)
  })
})

describe('flow-session: isExpired', () => {
  it('returns false when ttlMs <= 0 (never expires)', () => {
    expect(isExpired(validV2, 0)).toBe(false)
    expect(isExpired(validV2, -1)).toBe(false)
  })

  it('returns false when lastUpdatedAt is fresh', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(validV2.lastUpdatedAt + 100))
    try {
      expect(isExpired(validV2, 60 * 60 * 1000)).toBe(false)
    } finally {
      vi.useRealTimers()
    }
  })

  it('returns true when lastUpdatedAt is older than ttlMs', () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(validV2.lastUpdatedAt + 10_000))
    try {
      expect(isExpired(validV2, 1_000)).toBe(true)
    } finally {
      vi.useRealTimers()
    }
  })
})
