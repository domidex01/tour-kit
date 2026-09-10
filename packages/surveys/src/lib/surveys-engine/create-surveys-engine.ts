/**
 * `createSurveysEngine()` — the React-free half of `<SurveysProvider>`
 * (v3 Phase 3, Task 3.8).
 *
 * Step-3 contract: the constructor is INERT — no storage read, no `window`, no
 * timer — so a module-scope construction in an SSR bundle cannot throw.
 * `boot()` is the first thing that touches anything, and it is CANCELLABLE:
 * the storage read is awaited, and `destroy()` between the read and its
 * resolution must not land a HYDRATE on a torn-down engine. The provider
 * carried a `cancelled` flag for exactly this; it is ported, not dropped.
 *
 * Four seams are injected, each defaulting to today's behaviour:
 *   - `storage`  the adapter, built by the CALLER. Six existing suites stub
 *     `createStorageAdapter` through `vi.mock` on core's main barrel, and
 *     `vi.mock` does not intercept a `/engine` subpath — so resolving one here
 *     would silently disarm all six.
 *   - `random`   drawn ONCE at construction, as the provider drew once per
 *     mount. A testability seam; the default reproduces today's distribution.
 *   - `isScheduleActive`  the optional scheduling peer (Decision 7b)
 *   - `validateStep`  which question is at a step, and whether its answer
 *     passes. `QuestionConfig` carries media types, so it cannot enter here;
 *     the ORDER of validate → record error → advance stays engine-owned.
 * and one signal is forwarded by the binding: `setTourActive()`.
 */
import { createListeners } from '@tour-kit/core/engine'
import { SurveyScheduler } from '../../core/scheduler'
import { calculateCES, calculateCSAT, calculateNPS } from '../../core/scoring'
import type { CESResult, CSATResult, NPSResult } from '../../types/scoring'
import { passesFrequencyGates } from './frequency'
import { deserializeState, serializeState } from './persistence'
import { surveysReducer } from './reducer'
import {
  type AnswerValue,
  DEFAULT_SURVEY_QUEUE_CONFIG,
  type DismissalReason,
  type EngineSurveyConfig,
  type IsScheduleActive,
  type SurveyQueueConfig,
  type SurveyState,
  type SurveyStorageAdapter,
  type SurveysAction,
  type SurveysEngineState,
} from './types'

/** What a step's validator reports back to the engine. */
export interface StepValidation {
  questionId: string
  error: string | null
}

export interface SurveysEngineOptions<TConfig extends EngineSurveyConfig = EngineSurveyConfig> {
  surveys?: TConfig[]
  queueConfig?: Partial<SurveyQueueConfig>
  /** Built by the caller — see the module note on why this is not resolved here. */
  storage?: SurveyStorageAdapter | null
  storageKey?: string
  userContext?: Record<string, unknown>
  globalCooldownDays?: number
  samplingRate?: number
  maxPerSession?: number
  /** Drawn ONCE at construction, exactly as the provider drew once per mount. */
  random?: () => number
  now?: () => Date
  isScheduleActive?: IsScheduleActive
  validateStep?: (
    surveyId: string,
    step: number,
    responses: Map<string, AnswerValue>
  ) => StepValidation | null
  onShow?: (id: string) => void
  onDismiss?: (id: string, reason: DismissalReason) => void
  onSnooze?: (id: string) => void
  onAnswer?: (surveyId: string, questionId: string, value: AnswerValue) => void
  onComplete?: (surveyId: string, responses: Map<string, AnswerValue>) => void
  onScoreCalculated?: (
    surveyId: string,
    type: 'nps' | 'csat' | 'ces',
    result: NPSResult | CSATResult | CESResult
  ) => void
  /**
   * A pre-built seed. `createSurveysHandle` passes the SAME object it serves as
   * its pre-verb snapshot — two equal-but-distinct objects make `Object.is`
   * false and every consumer renders twice on construction (Phase 2's finding).
   */
  initialState?: SurveysEngineState
}

export interface SurveysEngine<TConfig extends EngineSurveyConfig = EngineSurveyConfig> {
  getState: () => SurveysEngineState
  subscribe: (listener: () => void) => () => void
  destroy: () => void
  /** Async: hydrates from storage. Cancelled by `destroy()`. */
  boot: () => Promise<void>
  register: (config: TConfig) => void
  unregister: (id: string) => void
  setSurveys: (configs: TConfig[]) => void
  setUserContext: (userContext: Record<string, unknown> | undefined) => void
  setQueueConfig: (queueConfig: Partial<SurveyQueueConfig>) => void
  /** Suppress surveys while a tour is running (plan Decision 7). */
  setTourActive: (active: boolean) => void
  show: (id: string) => void
  hide: (id: string) => void
  dismiss: (id: string, reason?: DismissalReason) => void
  snooze: (id: string) => void
  answer: (surveyId: string, questionId: string, value: AnswerValue) => void
  nextQuestion: (surveyId: string) => string | null
  prevQuestion: (surveyId: string) => void
  complete: (surveyId: string) => void
  reset: (id: string) => void
  resetAll: () => void
  getSurveyState: (id: string) => SurveyState | undefined
  getConfig: (id: string) => TConfig | undefined
  canShow: (id: string) => boolean
}

/**
 * The frozen empty snapshot. `useSyncExternalStore` compares with `Object.is`,
 * and this state type is not generic, so a plain frozen constant is enough —
 * announcements needs an identity function only because its state IS generic.
 */
export const initialSurveysState: SurveysEngineState = Object.freeze({
  surveys: new Map(),
  activeSurvey: null,
  queue: [],
})

/**
 * A storage-free, boot-free seed so a binding's FIRST render already carries
 * the registered surveys. One reducer pass, no side effects.
 */
export function seedSurveysState(configs: EngineSurveyConfig[]): SurveysEngineState {
  let state = initialSurveysState
  for (const config of configs) state = surveysReducer(state, { type: 'REGISTER', config })
  return state
}

export function createSurveysEngine<TConfig extends EngineSurveyConfig = EngineSurveyConfig>(
  options: SurveysEngineOptions<TConfig> = {}
): SurveysEngine<TConfig> {
  const {
    surveys: initialSurveys = [],
    storage = null,
    storageKey = 'tour-kit:surveys',
    samplingRate = 1,
    globalCooldownDays,
    maxPerSession,
    random = Math.random,
    now = () => new Date(),
    isScheduleActive,
    validateStep,
    onShow,
    onDismiss,
    onSnooze,
    onAnswer,
    onComplete,
    onScoreCalculated,
  } = options

  let configs = initialSurveys
  let userContext = options.userContext
  let queueConfig: SurveyQueueConfig = { ...DEFAULT_SURVEY_QUEUE_CONFIG, ...options.queueConfig }

  // Inert: allocates a priority queue and nothing else.
  const scheduler = new SurveyScheduler(queueConfig, isScheduleActive)
  const listeners = createListeners('surveys-engine')
  const storageStateKey = `${storageKey}:state`

  // Drawn once, at construction — the engine equivalent of the provider's
  // `useState(() => Math.random())`, which draws once per mount.
  const userRoll = random()

  let state =
    options.initialState ?? (options.surveys ? seedSurveysState(configs) : initialSurveysState)
  let hydrated = false
  let booted = false
  let destroyed = false
  let tourActive = false
  let lastShownAt: Date | null = null
  let sessionShowCount = 0

  const dispatch = (action: SurveysAction): void => {
    // `destroy()` is terminal for VERBS, not just for the fan-out: clearing the
    // listener set alone leaves a torn-down engine still changing its answer.
    if (destroyed) return
    const next = surveysReducer(state, action)
    if (next === state) return
    state = next
    persist()
    listeners.notify()
  }

  const persist = (): void => {
    if (!storage || !hydrated) return
    try {
      storage.setItem(storageStateKey, serializeState(state.surveys, state.queue, lastShownAt))
    } catch {
      // Storage might be full or unavailable
    }
  }

  const configOf = (id: string): TConfig | undefined => configs.find((c) => c.id === id)

  const canShowInternal = (id: string): boolean => {
    if (tourActive) return false
    const config = configOf(id)
    const surveyState = state.surveys.get(id)
    if (!config || !surveyState) return false
    if (!scheduler.canShow(config, surveyState, userContext)) return false
    return passesFrequencyGates({
      config,
      surveyState,
      userRoll,
      providerSamplingRate: samplingRate,
      providerGlobalCooldownDays: globalCooldownDays,
      providerMaxPerSession: maxPerSession,
      lastShownAt,
      sessionShowCount,
      now: now(),
    })
  }

  return {
    getState: () => state,
    subscribe: listeners.add,

    destroy: () => {
      if (destroyed) return
      destroyed = true
      listeners.clear()
    },

    boot: async () => {
      if (booted || destroyed) return
      booted = true

      if (storage) {
        const raw = await Promise.resolve(storage.getItem(storageStateKey))
        // The cancellability the provider's `cancelled` flag bought. Without
        // this, a `destroy()` while the read was in flight lands a HYDRATE on a
        // torn-down engine — core's own `boot()` still carries that hole and
        // this deliberately does not inherit it.
        if (destroyed) return
        const restored = deserializeState(raw)
        hydrated = true
        if (restored) {
          lastShownAt = restored.lastShownAt
          dispatch({ type: 'HYDRATE', surveys: restored.surveys, queue: restored.queue })
        }
      } else {
        hydrated = true
      }

      for (const config of configs) dispatch({ type: 'REGISTER', config })
    },

    register: (config) => {
      if (!configs.some((c) => c.id === config.id)) configs = [...configs, config]
      dispatch({ type: 'REGISTER', config })
    },

    unregister: (id) => {
      configs = configs.filter((c) => c.id !== id)
      dispatch({ type: 'UNREGISTER', id })
    },

    setSurveys: (next) => {
      configs = next
      for (const config of next) dispatch({ type: 'REGISTER', config })
    },

    setUserContext: (next) => {
      userContext = next
    },

    setQueueConfig: (next) => {
      queueConfig = { ...DEFAULT_SURVEY_QUEUE_CONFIG, ...next }
      scheduler.updateConfig(queueConfig)
    },

    setTourActive: (active) => {
      tourActive = active
      // The provider's `:521` effect: a tour starting hides whatever is up.
      // `drain: false` — a tour is a suppression, not a completion, so nothing
      // is promoted behind it.
      if (active && state.activeSurvey) {
        dispatch({ type: 'HIDE', id: state.activeSurvey, drain: false, at: now() })
      }
    },

    show: (id) => {
      if (!canShowInternal(id)) return
      lastShownAt = now()
      sessionShowCount += 1
      dispatch({ type: 'SHOW', id, at: now() })
      onShow?.(id)
      configOf(id)?.onShow?.()
    },

    hide: (id) => dispatch({ type: 'HIDE', id, drain: true, at: now() }),

    dismiss: (id, reason: DismissalReason = 'programmatic') => {
      dispatch({ type: 'DISMISS', id, reason, drain: true, at: now() })
      onDismiss?.(id, reason)
      configOf(id)?.onDismiss?.(reason)
    },

    snooze: (id) => {
      dispatch({
        type: 'SNOOZE',
        id,
        delayDays: configOf(id)?.snoozeDelayDays,
        drain: true,
        at: now(),
      })
      onSnooze?.(id)
    },

    answer: (surveyId, questionId, value) => {
      dispatch({ type: 'ANSWER', id: surveyId, questionId, value })
      onAnswer?.(surveyId, questionId, value)
      configOf(surveyId)?.onAnswer?.(questionId, value)
    },

    nextQuestion: (surveyId) => {
      // The ORDER is the engine's: validate, record or clear the error, then
      // advance only on a pass. Which question sits at the step, and what its
      // validator says, comes from the caller — `QuestionConfig` carries media
      // types and cannot enter a React-free engine.
      const survey = state.surveys.get(surveyId)
      if (survey && validateStep) {
        const result = validateStep(surveyId, survey.currentStep, survey.responses)
        if (result) {
          if (result.error != null) {
            dispatch({
              type: 'SET_VALIDATION_ERROR',
              id: surveyId,
              questionId: result.questionId,
              error: result.error,
            })
            return result.error
          }
          dispatch({ type: 'CLEAR_VALIDATION_ERROR', id: surveyId, questionId: result.questionId })
        }
      }
      dispatch({ type: 'NEXT_QUESTION', id: surveyId })
      return null
    },

    prevQuestion: (surveyId) => dispatch({ type: 'PREV_QUESTION', id: surveyId }),

    complete: (surveyId) => {
      const responses = state.surveys.get(surveyId)?.responses ?? new Map<string, AnswerValue>()
      dispatch({ type: 'COMPLETE', id: surveyId, drain: true, at: now() })
      onComplete?.(surveyId, responses)

      const config = configOf(surveyId)
      config?.onComplete?.(responses)

      if (config?.type && config.type !== 'custom' && onScoreCalculated) {
        const values = Array.from(responses.values()).filter(
          (v): v is number => typeof v === 'number'
        )
        if (values.length > 0) {
          let result: NPSResult | CSATResult | CESResult
          switch (config.type) {
            case 'nps':
              result = calculateNPS(values)
              break
            case 'csat':
              result = calculateCSAT(values)
              break
            case 'ces':
              result = calculateCES(values)
              break
          }
          onScoreCalculated(surveyId, config.type, result)
        }
      }
    },

    reset: (id) => dispatch({ type: 'RESET', id }),
    resetAll: () => dispatch({ type: 'RESET_ALL' }),

    getSurveyState: (id) => state.surveys.get(id),
    getConfig: (id) => configOf(id),
    canShow: canShowInternal,
  }
}
