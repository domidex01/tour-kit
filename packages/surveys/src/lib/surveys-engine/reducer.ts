/**
 * The surveys reducer, moved verbatim from `surveys-provider.tsx` in v3 Phase 3
 * Task 3.7. Pure `(state, action) => state`, no React, no DOM.
 *
 * `drainQueue` moves UNCHANGED and that is the point of Decision 5: it is
 * already atomic — a pure recursive function called from inside the HIDE /
 * DISMISS / SNOOZE / COMPLETE arms, skipping completed and dismissed entries
 * and returning one new state. One dispatch, one transition, by construction.
 * Announcements had to be rebuilt to reach this; surveys was already here.
 *
 * The local `SurveysReducerState` / `SurveysAction` declarations that sat
 * beside it live in `./types` now.
 */
import type { SurveyState, SurveysAction, SurveysEngineState } from './types'

export function createInitialSurveyState(id: string): SurveyState {
  return {
    id,
    isActive: false,
    isVisible: false,
    isDismissed: false,
    isSnoozed: false,
    isCompleted: false,
    viewCount: 0,
    lastViewedAt: null,
    dismissedAt: null,
    dismissalReason: null,
    completedAt: null,
    snoozeCount: 0,
    snoozeUntil: null,
    currentStep: 0,
    responses: new Map(),
    validationErrors: new Map(),
  }
}

export function drainQueue(state: SurveysEngineState): SurveysEngineState {
  if (state.queue.length === 0) {
    return { ...state, activeSurvey: null }
  }
  const [nextId, ...rest] = state.queue
  if (!nextId) return { ...state, activeSurvey: null, queue: rest }
  const existing = state.surveys.get(nextId)
  if (!existing) {
    return drainQueue({ ...state, queue: rest })
  }
  if (existing.isCompleted || existing.isDismissed) {
    return drainQueue({ ...state, queue: rest })
  }
  const surveys = new Map(state.surveys)
  surveys.set(nextId, {
    ...existing,
    isActive: true,
    isVisible: true,
    viewCount: existing.viewCount + 1,
    lastViewedAt: new Date(),
  })
  return { ...state, surveys, activeSurvey: nextId, queue: rest }
}

export function updateSurvey(
  state: SurveysEngineState,
  id: string,
  updater: (existing: SurveyState) => SurveyState
): SurveysEngineState {
  const existing = state.surveys.get(id)
  if (!existing) return state
  const surveys = new Map(state.surveys)
  surveys.set(id, updater(existing))
  return { ...state, surveys }
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: switch-based reducer; each case is small and self-contained — splitting would obscure state transitions
export function surveysReducer(
  state: SurveysEngineState,
  action: SurveysAction
): SurveysEngineState {
  switch (action.type) {
    case 'REGISTER': {
      if (state.surveys.has(action.config.id)) return state
      const surveys = new Map(state.surveys)
      surveys.set(action.config.id, createInitialSurveyState(action.config.id))
      return { ...state, surveys }
    }

    case 'UNREGISTER': {
      if (!state.surveys.has(action.id)) return state
      const surveys = new Map(state.surveys)
      surveys.delete(action.id)
      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
        queue: state.queue.filter((qid) => qid !== action.id),
      }
    }

    case 'SHOW': {
      const existing = state.surveys.get(action.id)
      if (!existing) return state
      if (existing.isCompleted || existing.isDismissed) return state
      if (state.activeSurvey === action.id && existing.isVisible) return state

      if (state.activeSurvey && state.activeSurvey !== action.id) {
        if (state.queue.includes(action.id)) return state
        return { ...state, queue: [...state.queue, action.id] }
      }

      const surveys = new Map(state.surveys)
      surveys.set(action.id, {
        ...existing,
        isActive: true,
        isVisible: true,
        viewCount: existing.viewCount + 1,
        lastViewedAt: new Date(),
      })
      return { ...state, surveys, activeSurvey: action.id }
    }

    case 'HIDE': {
      const next = updateSurvey(state, action.id, (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
      }))
      if (state.activeSurvey !== action.id) return next
      return action.drain ? drainQueue(next) : { ...next, activeSurvey: null }
    }

    case 'DISMISS': {
      const next = updateSurvey(state, action.id, (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: action.reason,
      }))
      if (state.activeSurvey !== action.id) return next
      return action.drain
        ? drainQueue({
            ...next,
            queue: next.queue.filter((qid) => qid !== action.id),
          })
        : { ...next, activeSurvey: null }
    }

    case 'SNOOZE': {
      const days = action.delayDays
      const next = updateSurvey(state, action.id, (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isSnoozed: true,
        snoozeCount: e.snoozeCount + 1,
        snoozeUntil:
          days !== undefined ? new Date(Date.now() + days * 24 * 60 * 60 * 1000) : e.snoozeUntil,
      }))
      if (state.activeSurvey !== action.id) return next
      return action.drain ? drainQueue(next) : { ...next, activeSurvey: null }
    }

    case 'ANSWER':
      return updateSurvey(state, action.id, (existing) => {
        const responses = new Map(existing.responses)
        responses.set(action.questionId, action.value)
        return { ...existing, responses }
      })

    case 'NEXT_QUESTION':
      return updateSurvey(state, action.id, (e) => ({
        ...e,
        currentStep: e.currentStep + 1,
      }))

    case 'PREV_QUESTION':
      return updateSurvey(state, action.id, (e) => ({
        ...e,
        currentStep: Math.max(0, e.currentStep - 1),
      }))

    case 'SET_VALIDATION_ERROR':
      return updateSurvey(state, action.id, (e) => {
        const validationErrors = new Map(e.validationErrors)
        validationErrors.set(action.questionId, action.error)
        return { ...e, validationErrors }
      })

    case 'CLEAR_VALIDATION_ERROR':
      return updateSurvey(state, action.id, (e) => {
        if (!e.validationErrors.has(action.questionId)) return e
        const validationErrors = new Map(e.validationErrors)
        validationErrors.delete(action.questionId)
        return { ...e, validationErrors }
      })

    case 'COMPLETE': {
      const next = updateSurvey(state, action.id, (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isCompleted: true,
        completedAt: new Date(),
      }))
      if (state.activeSurvey !== action.id) return next
      return action.drain ? drainQueue(next) : { ...next, activeSurvey: null }
    }

    case 'RESET': {
      if (!state.surveys.has(action.id)) return state
      const surveys = new Map(state.surveys)
      surveys.set(action.id, createInitialSurveyState(action.id))
      return { ...state, surveys }
    }

    case 'RESET_ALL': {
      const surveys = new Map<string, SurveyState>()
      for (const [id] of state.surveys) {
        surveys.set(id, createInitialSurveyState(id))
      }
      return { ...state, surveys, activeSurvey: null, queue: [] }
    }

    case 'HYDRATE': {
      // Merge, never replace: REGISTER runs synchronously on mount while
      // HYDRATE lands later from an async storage read. Replacing the map
      // wiped every registered survey missing from the persisted blob —
      // e.g. stale state written by another survey set on the same origin
      // blanked all freshly-configured surveys (and REGISTER never re-runs
      // unless the config ids change). Persisted entries win for matching
      // ids since they carry viewCount/completion history.
      const surveys = new Map(state.surveys)
      for (const [id, hydrated] of action.surveys) {
        surveys.set(id, hydrated)
      }
      return { ...state, surveys, queue: action.queue }
    }

    default:
      return state
  }
}

// ── Storage serialization ──────────────────────────────────
