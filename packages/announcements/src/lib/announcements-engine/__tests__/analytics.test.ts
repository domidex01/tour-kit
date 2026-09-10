/**
 * v3 Phase 3 Task 3.2 — the analytics payload, now a React-free leaf.
 *
 * The engine takes an injected callback rather than `@tour-kit/analytics`
 * (a React hook, and on the engine guard's forbidden list), so this derivation
 * is the whole of the coupling and it is worth pinning by shape.
 */
import { describe, expect, it } from 'vitest'
import { getAnnouncementAnalyticsMetadata } from '../analytics'

describe('getAnnouncementAnalyticsMetadata', () => {
  it('carries id, variant, category and the config metadata', () => {
    expect(
      getAnnouncementAnalyticsMetadata({
        id: 'welcome',
        variant: 'modal',
        priority: 'high',
        category: 'feature',
        metadata: { team: 'growth' },
      })
    ).toEqual({
      announcementId: 'welcome',
      variant: 'modal',
      priority: 'high',
      category: 'feature',
      announcementMetadata: { team: 'growth' },
    })
  })

  it('defaults an unset priority to `normal` rather than emitting undefined', () => {
    expect(getAnnouncementAnalyticsMetadata({ id: 'a' }).priority).toBe('normal')
  })

  it('lets call-site metadata override the derived fields', () => {
    // `...metadata` is last in the spread, so a caller can correct a field.
    const out = getAnnouncementAnalyticsMetadata({ id: 'a', priority: 'low' }, { priority: 'critical', extra: 1 })
    expect(out).toMatchObject({ announcementId: 'a', priority: 'critical', extra: 1 })
  })
})
