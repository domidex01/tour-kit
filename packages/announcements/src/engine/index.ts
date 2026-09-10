/**
 * `@tour-kit/announcements/engine` — the React-free door.
 *
 * v3 Phase 3. Everything here runs in Node, Vue, Svelte or a plain `<script>`:
 * no React, no JSX runtime, no DOM, and no `@tour-kit/license` gate. A consumer
 * drives the queue, the frequency rules, the audience and the schedule, and
 * renders whatever it likes.
 *
 * Two things are deliberately NOT re-exported from here:
 *   - `<AnnouncementsProvider>` and every component — they are the React half
 *   - the licence gate — it is imported once, in the provider (Decision 9).
 *     The engine path is currently UNGATED; whether non-React consumers are
 *     gated is a commercial decision the v3 handoff still carries as Open
 *     question 1.
 *
 * Re-exports and comments only. No declaration, no side-effect import — a
 * `const` here would be a byte every consumer of the main entry also pays for.
 *
 * The reducer, its action union, `createInitialState`, the storage-key helpers,
 * `computeEligibleIds` and the analytics payload derivation are deliberately
 * WITHHELD, exactly as core withholds `tourReducer` and checklists withholds
 * `checklistsReducer`. They are the seam the engine and a binding share, not a
 * consumer API; publishing them would make an internal state shape a
 * compatibility promise.
 *
 * The optional `@tour-kit/scheduling` peer is reached through a call-time
 * `require`, which degrades OPEN in every ESM build. An ESM consumer that wants
 * real schedule gating passes `isScheduleActive` from
 * `@tour-kit/scheduling/engine` into the factory (plan Decision 7b).
 */
export {
  type AnnouncementPriority,
  type AnnouncementState,
  type AnnouncementStorageAdapter,
  type AnnouncementVariant,
  type AnnouncementsAnalytics,
  type AnnouncementsAnalyticsEvent,
  type AnnouncementsEngine,
  type AnnouncementsEngineOptions,
  type AnnouncementsEngineState,
  type AnnouncementsHandle,
  DEFAULT_QUEUE_CONFIG,
  type DismissalReason,
  type EngineAnnouncementConfig,
  FORCE_SHOW_BYPASS,
  type ForceShowBypassKey,
  type IsScheduleActive,
  type PriorityOrder,
  type QueueConfig,
  type QueueItem,
  type StackBehavior,
  createAnnouncementsEngine,
  createAnnouncementsHandle,
  emptyAnnouncementsState,
  evaluateAnnouncementAudience,
  seedAnnouncementsState,
} from '../lib/announcements-engine'
