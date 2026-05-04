import type { ReactNode } from 'react'
import type { AudienceCondition } from '../../types/audience'

/**
 * A condition-based segment. Multiple AudienceConditions in the array are
 * AND-joined by `matchesAudience()` (Phase 1).
 *
 * To express OR composition, register a second segment with the alternate
 * conditions and reference both names at the call site, OR use an audience
 * operator that already supports OR semantics (e.g. `operator: 'in'` against
 * an array of values).
 *
 * @example
 *   const segments = {
 *     admins: [
 *       { type: 'user_property', key: 'role', operator: 'equals', value: 'admin' },
 *     ],
 *     'eu-pro': [
 *       { type: 'user_property', key: 'country', operator: 'in', value: ['DE','FR','ES','IT'] },
 *       { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
 *     ], // AND-joined: EU country AND plan=pro
 *   }
 */
export type SegmentDefinition = AudienceCondition[]

/**
 * A static, CSV-loadable cohort of user IDs. Resolves to `true` when the
 * provider's `currentUserId` appears in the list. Returns `false` (without
 * throwing) when `currentUserId` is undefined, so anonymous-user code paths
 * stay stable.
 */
export interface StaticSegment {
  type: 'static'
  userIds: ReadonlyArray<string>
}

/**
 * Discriminated union for segment registration. Narrow with `Array.isArray(seg)`:
 * arrays are `SegmentDefinition`, objects are `StaticSegment`.
 */
export type SegmentSource = SegmentDefinition | StaticSegment

export interface SegmentationContextValue {
  segments: Record<string, SegmentSource>
  userContext?: Record<string, unknown>
  currentUserId?: string
}

export interface SegmentationProviderProps extends SegmentationContextValue {
  children: ReactNode
}
