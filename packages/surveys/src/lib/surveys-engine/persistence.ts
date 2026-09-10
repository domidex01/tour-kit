/**
 * Persistence, moved verbatim from `surveys-provider.tsx` in v3 Phase 3 Task
 * 3.7. The blob crosses a trust boundary, so the field-by-field narrowing and
 * the `try/catch` stay exactly as they were — no Zod, no schema library.
 *
 * The storage ADAPTER is injected rather than resolved here (§0 C5): six
 * existing suites stub `createStorageAdapter` through `vi.mock` on core's main
 * barrel, and `vi.mock` does not intercept a `/engine` subpath. Resolving one
 * here would leave all six silently running against real jsdom `localStorage`.
 */
import type { AnswerValue, DismissalReason, SurveyState } from './types'

interface SerializedSurveyState {
  id: string
  isActive: boolean
  isVisible: boolean
  isDismissed: boolean
  isSnoozed: boolean
  isCompleted: boolean
  viewCount: number
  lastViewedAt: string | null
  dismissedAt: string | null
  dismissalReason: DismissalReason | null
  completedAt: string | null
  snoozeCount: number
  snoozeUntil: string | null
  currentStep: number
  responses: Array<[string, AnswerValue]>
}

interface SerializedState {
  surveys: Array<[string, SerializedSurveyState]>
  queue: string[]
  lastShownAt: string | null
}

export function serializeState(
  surveys: Map<string, SurveyState>,
  queue: string[],
  lastShownAt: Date | null
): string {
  const payload: SerializedState = {
    // Build each entry explicitly (not `{ ...s }`) so transient runtime-only
    // fields — `validationErrors` — can never leak into the blob. A spread would
    // silently carry new SurveyState fields into storage; enumeration makes the
    // persisted shape a deliberate allow-list that matches SerializedSurveyState.
    surveys: Array.from(surveys.entries()).map(([id, s]) => [
      id,
      {
        id: s.id,
        isActive: s.isActive,
        isVisible: s.isVisible,
        isDismissed: s.isDismissed,
        isSnoozed: s.isSnoozed,
        isCompleted: s.isCompleted,
        viewCount: s.viewCount,
        lastViewedAt: s.lastViewedAt?.toISOString() ?? null,
        dismissedAt: s.dismissedAt?.toISOString() ?? null,
        dismissalReason: s.dismissalReason,
        completedAt: s.completedAt?.toISOString() ?? null,
        snoozeCount: s.snoozeCount,
        snoozeUntil: s.snoozeUntil?.toISOString() ?? null,
        currentStep: s.currentStep,
        responses: Array.from(s.responses.entries()),
      },
    ]),
    queue,
    lastShownAt: lastShownAt?.toISOString() ?? null,
  }
  return JSON.stringify(payload)
}

export function deserializeState(raw: string | null): {
  surveys: Map<string, SurveyState>
  queue: string[]
  lastShownAt: Date | null
} | null {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as SerializedState
    const surveys = new Map<string, SurveyState>()
    for (const [id, s] of parsed.surveys) {
      surveys.set(id, {
        id: s.id,
        isActive: false,
        isVisible: false,
        isDismissed: s.isDismissed,
        isSnoozed: s.isSnoozed,
        isCompleted: s.isCompleted,
        viewCount: s.viewCount,
        lastViewedAt: s.lastViewedAt ? new Date(s.lastViewedAt) : null,
        dismissedAt: s.dismissedAt ? new Date(s.dismissedAt) : null,
        dismissalReason: s.dismissalReason,
        completedAt: s.completedAt ? new Date(s.completedAt) : null,
        snoozeCount: s.snoozeCount,
        snoozeUntil: s.snoozeUntil ? new Date(s.snoozeUntil) : null,
        currentStep: s.currentStep,
        responses: new Map(s.responses),
        // Transient — never serialized. Old blobs have no such key; a fresh
        // empty Map is the back-compat default so a stale error never resurfaces.
        validationErrors: new Map(),
      })
    }
    return {
      surveys,
      queue: parsed.queue ?? [],
      lastShownAt: parsed.lastShownAt ? new Date(parsed.lastShownAt) : null,
    }
  } catch {
    return null
  }
}
