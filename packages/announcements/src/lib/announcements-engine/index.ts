/**
 * Internal barrel for the announcements engine. The PUBLIC door is
 * `src/engine/index.ts`; this one exists so in-package React files import one
 * path instead of six.
 */
export { getAnnouncementAnalyticsMetadata } from './analytics'
export {
  type AnnouncementsAnalytics,
  type AnnouncementsAnalyticsEvent,
  type AnnouncementsEngine,
  type AnnouncementsEngineOptions,
  createAnnouncementsEngine,
  emptyAnnouncementsState,
  seedAnnouncementsState,
} from './create-announcements-engine'
export {
  type AnnouncementsHandle,
  createAnnouncementsHandle,
} from './create-announcements-handle'
export { computeEligibleIds, evaluateAnnouncementAudience } from './eligibility'
export { STORAGE_KEY_PREFIX, getStorageKey } from './persistence'
export {
  FORCE_SHOW_BYPASS,
  type ForceShowBypassKey,
  announcementsReducer,
  createInitialState,
} from './reducer'
export {
  DEFAULT_QUEUE_CONFIG,
  type AnnouncementPriority,
  type AnnouncementState,
  type AnnouncementStorageAdapter,
  type AnnouncementVariant,
  type AnnouncementsAction,
  type AnnouncementsEngineState,
  type DismissalReason,
  type EngineAnnouncementConfig,
  type IsScheduleActive,
  type PriorityOrder,
  type QueueConfig,
  type QueueItem,
  type StackBehavior,
} from './types'
