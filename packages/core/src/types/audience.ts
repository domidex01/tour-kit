/**
 * Audience targeting condition
 *
 * PHASE 0 SPIKE — copied verbatim from packages/announcements/src/types/announcement.ts
 * lines 197–217. Promotion to permanent core resident is Phase 1.6 of
 * userguiding-parity-big-plan.md. Reverted at end of Phase 0 — do not ship.
 */
export interface AudienceCondition {
  /** Condition type */
  type: 'user_property' | 'segment' | 'feature_flag' | 'custom'

  /** Property or segment name */
  key: string

  /** Comparison operator */
  operator:
    | 'equals'
    | 'not_equals'
    | 'contains'
    | 'not_contains'
    | 'in'
    | 'not_in'
    | 'exists'
    | 'not_exists'

  /** Expected value(s) */
  value?: unknown
}
