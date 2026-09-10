/**
 * Queue types. The definitions moved to `../lib/announcements-engine/types` in
 * v3 Phase 3 — `core/priority-queue.ts` and `core/scheduler.ts` are inside the
 * engine barrel's closure and this file used to reach `./announcement`, whose
 * first line imports `react` (recipe gap 18). This barrel is kept so
 * `import { QueueConfig } from '@tour-kit/announcements'` still resolves.
 */
export type {
  PriorityOrder,
  QueueConfig,
  QueueItem,
  StackBehavior,
} from '../lib/announcements-engine/types'
export { DEFAULT_QUEUE_CONFIG } from '../lib/announcements-engine/types'
