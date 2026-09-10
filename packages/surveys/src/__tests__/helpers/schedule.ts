/**
 * The optional-peer seam's fake (v3 Phase 3 §3, plan Decision 7b).
 *
 * Ignores its arguments on purpose: `resolveScheduleActive`'s third parameter
 * is a LOADER, not an `IsScheduleActive` (§0 C15), so a mis-wiring calls this
 * with no arguments. Ignoring them means the test still discriminates on the
 * VALUE rather than passing by accident on a throw the resolver would swallow.
 */
import type { IsScheduleActive } from '../../lib/surveys-engine/types'

export const fakeIsScheduleActive = (isActive: boolean): IsScheduleActive =>
  (() => ({ isActive })) as IsScheduleActive
