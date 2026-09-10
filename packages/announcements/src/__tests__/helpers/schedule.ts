/**
 * The optional-peer seam's fake (v3 Phase 3 §3, plan Decision 7b).
 *
 * It ignores its arguments on purpose. `resolveScheduleActive`'s third
 * parameter is a LOADER, not an `IsScheduleActive` (§0 C15) — wiring the
 * injected function straight in as `load` calls it with no arguments, it
 * throws on `schedule.type`, the `catch` swallows it and the gate silently
 * degrades open. Ignoring arguments means this fake still returns its value
 * under that mis-wiring, so the test discriminates on the VALUE rather than
 * passing by accident on a throw.
 */
import type { IsScheduleActive } from '../../lib/announcements-engine/types'

export const fakeIsScheduleActive = (isActive: boolean): IsScheduleActive =>
  (() => ({ isActive })) as IsScheduleActive
