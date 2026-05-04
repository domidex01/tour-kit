/**
 * @deprecated Import from `@tour-kit/core` instead. These functions were
 * promoted to core in Phase 1 of the UserGuiding parity initiative; the
 * announcements re-export will be removed in a future major.
 *
 * The `AudienceCondition` type lives in `./types/announcement` (a re-export
 * from `@tour-kit/core`) — keep importing it from there to avoid duplicate
 * barrel exports through the headless entry point.
 */
export { matchesAudience, validateConditions } from '@tour-kit/core'
