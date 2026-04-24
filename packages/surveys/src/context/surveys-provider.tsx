import { createStorageAdapter, useTourContextOptional } from '@tour-kit/core'
import { ProGate } from '@tour-kit/license'
import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
} from 'react'
import { SurveyScheduler } from '../core/scheduler'
import { calculateCES, calculateCSAT, calculateNPS } from '../core/scoring'
import type { SurveysContextValue, SurveysProviderProps } from '../types/context'
import type { AnswerValue } from '../types/question'
import { DEFAULT_SURVEY_QUEUE_CONFIG, type SurveyQueueConfig } from '../types/queue'
import type { CESResult, CSATResult, NPSResult } from '../types/scoring'
import type { DismissalReason, SurveyConfig, SurveyState } from '../types/survey'
import { SurveysContext } from './surveys-context'

// ── Reducer types ──────────────────────────────────────────

type SurveysAction =
  | { type: 'REGISTER'; config: SurveyConfig }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string; drain: boolean }
  | { type: 'DISMISS'; id: string; reason: DismissalReason; drain: boolean }
  | { type: 'SNOOZE'; id: string; delayDays?: number; drain: boolean }
  | { type: 'ANSWER'; id: string; questionId: string; value: AnswerValue }
  | { type: 'NEXT_QUESTION'; id: string }
  | { type: 'PREV_QUESTION'; id: string }
  | { type: 'COMPLETE'; id: string; drain: boolean }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }
  | { type: 'HYDRATE'; surveys: Map<string, SurveyState>; queue: string[] }

interface SurveysReducerState {
  surveys: Map<string, SurveyState>
  activeSurvey: string | null
  queue: string[]
}

function createInitialSurveyState(id: string): SurveyState {
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
  }
}

function drainQueue(state: SurveysReducerState): SurveysReducerState {
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

function updateSurvey(
  state: SurveysReducerState,
  id: string,
  updater: (existing: SurveyState) => SurveyState
): SurveysReducerState {
  const existing = state.surveys.get(id)
  if (!existing) return state
  const surveys = new Map(state.surveys)
  surveys.set(id, updater(existing))
  return { ...state, surveys }
}

function surveysReducer(state: SurveysReducerState, action: SurveysAction): SurveysReducerState {
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

    case 'HYDRATE':
      return { ...state, surveys: action.surveys, queue: action.queue }

    default:
      return state
  }
}

// ── Storage serialization ──────────────────────────────────

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

function serializeState(
  surveys: Map<string, SurveyState>,
  queue: string[],
  lastShownAt: Date | null
): string {
  const payload: SerializedState = {
    surveys: Array.from(surveys.entries()).map(([id, s]) => [
      id,
      {
        ...s,
        lastViewedAt: s.lastViewedAt?.toISOString() ?? null,
        dismissedAt: s.dismissedAt?.toISOString() ?? null,
        completedAt: s.completedAt?.toISOString() ?? null,
        snoozeUntil: s.snoozeUntil?.toISOString() ?? null,
        responses: Array.from(s.responses.entries()),
      },
    ]),
    queue,
    lastShownAt: lastShownAt?.toISOString() ?? null,
  }
  return JSON.stringify(payload)
}

function deserializeState(raw: string | null): {
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

function daysBetween(a: Date, b: Date): number {
  const msPerDay = 24 * 60 * 60 * 1000
  return Math.floor(Math.abs(b.getTime() - a.getTime()) / msPerDay)
}

// ── Provider ───────────────────────────────────────────────

export function SurveysProvider({
  children,
  surveys: surveyConfigs = [],
  queueConfig,
  storage: storageProp,
  storageKey = 'tour-kit:surveys',
  userContext,
  globalCooldownDays,
  samplingRate = 1,
  maxPerSession,
  onSurveyShow,
  onSurveyDismiss,
  onSurveyComplete,
  onSurveyAnswer,
  onSurveySnooze,
  onQuestionAnswered,
  onScoreCalculated,
}: SurveysProviderProps): ReactNode {
  const [state, dispatch] = useReducer(surveysReducer, {
    surveys: new Map(),
    activeSurvey: null,
    queue: [],
  })

  const configsRef = useRef(surveyConfigs)
  configsRef.current = surveyConfigs

  const stateRef = useRef(state)
  stateRef.current = state

  const mergedQueueConfig = useMemo<SurveyQueueConfig>(
    () => ({ ...DEFAULT_SURVEY_QUEUE_CONFIG, ...queueConfig }),
    [queueConfig]
  )

  const schedulerRef = useRef<SurveyScheduler | null>(null)
  if (schedulerRef.current === null) {
    schedulerRef.current = new SurveyScheduler(mergedQueueConfig)
  }
  useEffect(() => {
    schedulerRef.current?.updateConfig(mergedQueueConfig)
  }, [mergedQueueConfig])

  const storage = useMemo(() => {
    if (storageProp === null) return null
    return createStorageAdapter(storageProp ?? 'localStorage')
  }, [storageProp])

  const storageStateKey = `${storageKey}:state`
  const hydratedRef = useRef(false)
  const lastShownAtRef = useRef<Date | null>(null)
  const sessionShowCountRef = useRef(0)

  const [userRoll] = useState(() => Math.random())

  // Hydrate from storage on mount
  useEffect(() => {
    if (hydratedRef.current || !storage) {
      hydratedRef.current = true
      return
    }
    let cancelled = false
    Promise.resolve(storage.getItem(storageStateKey)).then((raw) => {
      if (cancelled) return
      const hydrated = deserializeState(raw)
      if (hydrated) {
        dispatch({ type: 'HYDRATE', surveys: hydrated.surveys, queue: hydrated.queue })
        lastShownAtRef.current = hydrated.lastShownAt
      }
      hydratedRef.current = true
    })
    return () => {
      cancelled = true
    }
  }, [storage, storageStateKey])

  // Register configs after hydration
  const ids = useMemo(() => surveyConfigs.map((c) => c.id).join('|'), [surveyConfigs])
  useEffect(() => {
    for (const config of configsRef.current) {
      dispatch({ type: 'REGISTER', config })
    }
  }, [ids])

  // Persist on state change
  useEffect(() => {
    if (!storage || !hydratedRef.current) return
    const serialized = serializeState(state.surveys, state.queue, lastShownAtRef.current)
    storage.setItem(storageStateKey, serialized)
  }, [state.surveys, state.queue, storage, storageStateKey])

  // Suppress surveys while a tour is active
  const tourContext = useTourContextOptional()
  const isTourActive = tourContext?.isActive ?? false

  useEffect(() => {
    if (isTourActive && state.activeSurvey) {
      dispatch({ type: 'HIDE', id: state.activeSurvey, drain: false })
    }
  }, [isTourActive, state.activeSurvey])

  // ── Gate: can this survey be shown right now? ──

  const canShowInternal = useCallback(
    (id: string): boolean => {
      if (isTourActive) return false
      const config = configsRef.current.find((c) => c.id === id)
      const surveyState = stateRef.current.surveys.get(id)
      if (!config || !surveyState) return false

      const scheduler = schedulerRef.current
      if (scheduler && !scheduler.canShow(config, surveyState, userContext)) return false

      const effectiveSampling = Math.min(samplingRate, config.samplingRate ?? 1)
      if (userRoll >= effectiveSampling) return false

      const effectiveCooldown = config.globalCooldownDays ?? globalCooldownDays
      if (
        effectiveCooldown !== undefined &&
        lastShownAtRef.current &&
        daysBetween(lastShownAtRef.current, new Date()) < effectiveCooldown
      ) {
        return false
      }

      const effectiveMaxPerSession = config.maxPerSession ?? maxPerSession
      if (
        effectiveMaxPerSession !== undefined &&
        sessionShowCountRef.current >= effectiveMaxPerSession
      ) {
        return false
      }

      if (config.maxSnoozeCount !== undefined && surveyState.snoozeCount >= config.maxSnoozeCount) {
        return false
      }

      return true
    },
    [isTourActive, userContext, samplingRate, globalCooldownDays, maxPerSession, userRoll]
  )

  // ── Action handlers ──

  const handleShow = useCallback(
    (id: string) => {
      if (!canShowInternal(id)) return
      dispatch({ type: 'SHOW', id })
      lastShownAtRef.current = new Date()
      sessionShowCountRef.current += 1
      onSurveyShow?.(id)
      const cfg = configsRef.current.find((c) => c.id === id)
      cfg?.onShow?.()
    },
    [canShowInternal, onSurveyShow]
  )

  const handleHide = useCallback((id: string) => {
    dispatch({ type: 'HIDE', id, drain: true })
  }, [])

  const handleDismiss = useCallback(
    (id: string, reason: DismissalReason = 'programmatic') => {
      dispatch({ type: 'DISMISS', id, reason, drain: true })
      onSurveyDismiss?.(id, reason)
      const cfg = configsRef.current.find((c) => c.id === id)
      cfg?.onDismiss?.(reason)
    },
    [onSurveyDismiss]
  )

  const handleSnooze = useCallback(
    (id: string) => {
      const cfg = configsRef.current.find((c) => c.id === id)
      dispatch({ type: 'SNOOZE', id, delayDays: cfg?.snoozeDelayDays, drain: true })
      onSurveySnooze?.(id)
    },
    [onSurveySnooze]
  )

  const handleAnswer = useCallback(
    (surveyId: string, questionId: string, value: AnswerValue) => {
      dispatch({ type: 'ANSWER', id: surveyId, questionId, value })
      onQuestionAnswered?.(surveyId, questionId, value)
      onSurveyAnswer?.(surveyId, questionId, value)
      const cfg = configsRef.current.find((c) => c.id === surveyId)
      cfg?.onAnswer?.(questionId, value)
    },
    [onQuestionAnswered, onSurveyAnswer]
  )

  const handleNextQuestion = useCallback((surveyId: string) => {
    dispatch({ type: 'NEXT_QUESTION', id: surveyId })
  }, [])

  const handlePrevQuestion = useCallback((surveyId: string) => {
    dispatch({ type: 'PREV_QUESTION', id: surveyId })
  }, [])

  const handleComplete = useCallback(
    (surveyId: string) => {
      const surveyState = stateRef.current.surveys.get(surveyId)
      const responses = surveyState?.responses ?? new Map<string, AnswerValue>()

      dispatch({ type: 'COMPLETE', id: surveyId, drain: true })
      onSurveyComplete?.(surveyId, responses)

      const config = configsRef.current.find((s) => s.id === surveyId)
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
    [onSurveyComplete, onScoreCalculated]
  )

  const handleRegister = useCallback((config: SurveyConfig) => {
    dispatch({ type: 'REGISTER', config })
  }, [])

  const handleUnregister = useCallback((id: string) => {
    dispatch({ type: 'UNREGISTER', id })
  }, [])

  const handleReset = useCallback((id: string) => {
    dispatch({ type: 'RESET', id })
  }, [])

  const handleResetAll = useCallback(() => {
    dispatch({ type: 'RESET_ALL' })
  }, [])

  const getState = useCallback((id: string) => state.surveys.get(id), [state.surveys])

  const getConfig = useCallback((id: string) => configsRef.current.find((s) => s.id === id), [])

  const value = useMemo<SurveysContextValue>(
    () => ({
      surveys: state.surveys,
      activeSurvey: state.activeSurvey,
      queue: state.queue,
      register: handleRegister,
      unregister: handleUnregister,
      show: handleShow,
      hide: handleHide,
      dismiss: handleDismiss,
      snooze: handleSnooze,
      answer: handleAnswer,
      nextQuestion: handleNextQuestion,
      prevQuestion: handlePrevQuestion,
      complete: handleComplete,
      reset: handleReset,
      resetAll: handleResetAll,
      getState,
      getConfig,
      canShow: canShowInternal,
    }),
    [
      state.surveys,
      state.activeSurvey,
      state.queue,
      handleRegister,
      handleUnregister,
      handleShow,
      handleHide,
      handleDismiss,
      handleSnooze,
      handleAnswer,
      handleNextQuestion,
      handlePrevQuestion,
      handleComplete,
      handleReset,
      handleResetAll,
      getState,
      getConfig,
      canShowInternal,
    ]
  )

  return (
    <ProGate package="@tour-kit/surveys">
      <SurveysContext.Provider value={value}>{children}</SurveysContext.Provider>
    </ProGate>
  )
}
