import type { Schedule } from '@tour-kit/scheduling'

/**
 * Resolve an `AnnouncementConfig.schedule` $ref to a real schedule evaluation.
 *
 * `@tour-kit/scheduling` is an OPTIONAL peer (`peerDependenciesMeta.optional`),
 * so it must NOT be a hard module-load import — a consumer who never sets a
 * `schedule` may not have it installed. We resolve `isScheduleActive` lazily at
 * call time and DEGRADE OPEN: if the peer is absent (or anything throws) we
 * return `true`, so content is never suppressed merely because the optional dep
 * is missing. The field is only read when `config.schedule` is set, by which
 * point a correct consumer already depends on scheduling for the `Schedule`
 * type itself.
 *
 * Note: in a pure-ESM browser bundle without a `require` shim this degrades
 * open (the schedule is treated as active). CJS, bundlers that provide
 * `require`, and the test runner all resolve it for real.
 */
type IsScheduleActive = (schedule: Schedule, options: { now: Date }) => { isActive: boolean }

interface SchedulingModule {
  isScheduleActive: IsScheduleActive
}

// Reached through a runtime require so `@tour-kit/scheduling` stays optional.
// Typed locally because these browser packages don't pull in `@types/node`.
declare const require: undefined | ((id: string) => unknown)

/** Load the optional scheduling peer, or `null` if it isn't installed. */
export function loadScheduling(): SchedulingModule | null {
  if (typeof require !== 'function') return null
  try {
    const mod = require('@tour-kit/scheduling') as Partial<SchedulingModule>
    return typeof mod.isScheduleActive === 'function' ? (mod as SchedulingModule) : null
  } catch {
    return null
  }
}

/**
 * `load` is injectable purely as a test seam for the degrade-open contract; in
 * production it defaults to {@link loadScheduling}.
 */
export function resolveScheduleActive(
  schedule: Schedule,
  now: Date,
  load: () => SchedulingModule | null = loadScheduling
): boolean {
  try {
    const scheduling = load()
    if (!scheduling) return true // optional peer absent → don't suppress content
    return scheduling.isScheduleActive(schedule, { now }).isActive
  } catch {
    return true // any failure degrades open — never suppress on the optional path
  }
}
