/**
 * Queue types. The definitions moved to `../lib/surveys-engine/types` in v3
 * Phase 3 — `core/priority-queue.ts` and `core/scheduler.ts` are inside the
 * engine barrel's closure and this file used to reach `./survey`, which
 * type-imports ReactNode (recipe gap 18). This barrel is kept so
 * `import { SurveyQueueConfig } from '@tour-kit/surveys'` still resolves.
 */
export type {
  PriorityOrder,
  StackBehavior,
  SurveyQueueConfig,
  SurveyQueueItem,
} from '../lib/surveys-engine/types'
export { DEFAULT_SURVEY_QUEUE_CONFIG } from '../lib/surveys-engine/types'
