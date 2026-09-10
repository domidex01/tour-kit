import { createStorageAdapter, useTourContextOptional } from '@tour-kit/core'
import { LicenseGate } from '@tour-kit/license'
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
import type { DismissalReason, SurveyConfig } from '../types/survey'
import { deserializeState, serializeState } from '../lib/surveys-engine/persistence'
import { passesFrequencyGates } from '../lib/surveys-engine/frequency'
import { surveysReducer } from '../lib/surveys-engine/reducer'
import { SurveysContext } from './surveys-context'

// ── The pure layer moved to `../lib/surveys-engine/` (v3 Phase 3, Task 3.7):
// the reducer and its atomic `drainQueue`, serialize/deserialize, and the six
// fatigue gates. 401 lines, no React in any of them.
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

  // Register configs after hydration; re-run when the set of config ids changes.
  const ids = useMemo(() => surveyConfigs.map((c) => c.id).join('|'), [surveyConfigs])
  // biome-ignore lint/correctness/useExhaustiveDependencies: `ids` is a stable re-run trigger; effect body reads the mutable ref.
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

      return passesFrequencyGates({
        config,
        surveyState,
        userRoll,
        providerSamplingRate: samplingRate,
        providerGlobalCooldownDays: globalCooldownDays,
        providerMaxPerSession: maxPerSession,
        lastShownAt: lastShownAtRef.current,
        sessionShowCount: sessionShowCountRef.current,
        now: new Date(),
      })
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

  const handleNextQuestion = useCallback((surveyId: string): string | null => {
    // Read latest state/config off refs (same idiom as handleComplete/handleAnswer)
    // so the gate sees the most recent answer recorded in this render cycle.
    const survey = stateRef.current.surveys.get(surveyId)
    const config = configsRef.current.find((c) => c.id === surveyId)
    const question = config?.questions?.[survey?.currentStep ?? 0]
    if (question?.validation && survey) {
      // `value` is `AnswerValue | undefined` — undefined when the question is
      // unanswered, which is exactly the case `validation` exists to catch (a
      // required field). The cast bridges to the public `(value: AnswerValue)`
      // signature, which can't be widened to `| undefined` without a breaking
      // change to that frozen shape. Validation authors must handle a falsy value.
      const value = survey.responses.get(question.id)
      const error = question.validation(value as AnswerValue)
      if (error != null) {
        dispatch({
          type: 'SET_VALIDATION_ERROR',
          id: surveyId,
          questionId: question.id,
          error,
        })
        return error
      }
      dispatch({ type: 'CLEAR_VALIDATION_ERROR', id: surveyId, questionId: question.id })
    }
    dispatch({ type: 'NEXT_QUESTION', id: surveyId })
    return null
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

  const getValidationError = useCallback(
    (id: string, questionId: string) => state.surveys.get(id)?.validationErrors.get(questionId),
    [state.surveys]
  )

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
      getValidationError,
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
      getValidationError,
      getConfig,
      canShowInternal,
    ]
  )

  return (
    <LicenseGate require="pro">
      <SurveysContext.Provider value={value}>{children}</SurveysContext.Provider>
    </LicenseGate>
  )
}
