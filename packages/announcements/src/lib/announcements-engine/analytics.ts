/**
 * Analytics payload derivation, moved verbatim from
 * `announcements-provider.tsx` in v3 Phase 3 Task 3.2.
 *
 * The engine takes an injected `analytics` CALLBACK, never `@tour-kit/analytics`
 * itself — `useAnalyticsOptional` is a React hook and the package is on the
 * engine guard's forbidden list (plan Decision 9).
 */
import type { EngineAnnouncementConfig } from './types'

export function getAnnouncementAnalyticsMetadata(
  config: EngineAnnouncementConfig,
  metadata?: Record<string, unknown>
): Record<string, unknown> {
  return {
    announcementId: config.id,
    variant: config.variant,
    priority: config.priority ?? 'normal',
    category: config.category,
    announcementMetadata: config.metadata,
    ...metadata,
  }
}
