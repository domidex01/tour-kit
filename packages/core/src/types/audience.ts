/**
 * Audience targeting condition.
 *
 * Promoted from `@tour-kit/announcements` in Phase 1 of the UserGuiding parity
 * initiative. The shape is byte-identical to the previous announcements-local
 * declaration so the announcements re-export keeps the same TypeScript identity.
 */
export interface AudienceCondition {
  /** Condition type */
  type: 'user_property' | 'segment' | 'feature_flag' | 'custom'

  /** Property or segment name (supports dot notation for nested keys) */
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

  /** Expected value(s) — required for every operator except `exists`/`not_exists` */
  value?: unknown
}
