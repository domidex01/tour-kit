import { useTourContext } from '@tour-kit/core'
import { type ReactNode, useCallback, useEffect, useMemo, useReducer, useRef } from 'react'
import { calculateCES, calculateCSAT, calculateNPS } from '../core/scoring'
import type { SurveysContextValue, SurveysProviderProps } from '../types/context'
import type { AnswerValue } from '../types/question'
import type { CESResult, CSATResult, NPSResult } from '../types/scoring'
import type { DismissalReason, SurveyConfig, SurveyState } from '../types/survey'
import { SurveysContext } from './surveys-context'

// ── Reducer types ──────────────────────────────────────────

type SurveysAction =
  | { type: 'REGISTER'; config: SurveyConfig }
  | { type: 'UNREGISTER'; id: string }
  | { type: 'SHOW'; id: string }
  | { type: 'HIDE'; id: string }
  | { type: 'DISMISS'; id: string; reason: DismissalReason }
  | { type: 'SNOOZE'; id: string }
  | { type: 'ANSWER'; id: string; questionId: string; value: AnswerValue }
  | { type: 'NEXT_QUESTION'; id: string }
  | { type: 'PREV_QUESTION'; id: string }
  | { type: 'COMPLETE'; id: string }
  | { type: 'RESET'; id: string }
  | { type: 'RESET_ALL' }

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

function updateSurvey(
  state: SurveysReducerState,
  id: string,
  updater: (existing: SurveyState) => SurveyState,
  clearActive = false
): SurveysReducerState {
  const surveys = new Map(state.surveys)
  const existing = surveys.get(id)
  if (!existing) return state
  surveys.set(id, updater(existing))
  return {
    ...state,
    surveys,
    activeSurvey: clearActive && state.activeSurvey === id ? null : state.activeSurvey,
  }
}

function handleRegister(state: SurveysReducerState, config: SurveyConfig): SurveysReducerState {
  const surveys = new Map(state.surveys)
  if (!surveys.has(config.id)) {
    surveys.set(config.id, createInitialSurveyState(config.id))
  }
  return { ...state, surveys }
}

function handleUnregister(state: SurveysReducerState, id: string): SurveysReducerState {
  const surveys = new Map(state.surveys)
  surveys.delete(id)
  return {
    ...state,
    surveys,
    activeSurvey: state.activeSurvey === id ? null : state.activeSurvey,
    queue: state.queue.filter((qid) => qid !== id),
  }
}

function handleShow(state: SurveysReducerState, id: string): SurveysReducerState {
  const existing = state.surveys.get(id)
  if (!existing) return state

  if (state.activeSurvey && state.activeSurvey !== id) {
    return { ...state, queue: [...state.queue, id] }
  }

  const surveys = new Map(state.surveys)
  surveys.set(id, {
    ...existing,
    isActive: true,
    isVisible: true,
    viewCount: existing.viewCount + 1,
    lastViewedAt: new Date(),
  })
  return { ...state, surveys, activeSurvey: id }
}

function handleAnswer(
  state: SurveysReducerState,
  id: string,
  questionId: string,
  value: AnswerValue
): SurveysReducerState {
  return updateSurvey(state, id, (existing) => {
    const responses = new Map(existing.responses)
    responses.set(questionId, value)
    return { ...existing, responses }
  })
}

const reducerHandlers: Record<
  string,
  (state: SurveysReducerState, action: SurveysAction) => SurveysReducerState
> = {
  REGISTER: (state, action) => handleRegister(state, (action as { config: SurveyConfig }).config),
  UNREGISTER: (state, action) => handleUnregister(state, (action as { id: string }).id),
  SHOW: (state, action) => handleShow(state, (action as { id: string }).id),
  HIDE: (state, action) =>
    updateSurvey(
      state,
      (action as { id: string }).id,
      (e) => ({ ...e, isActive: false, isVisible: false }),
      true
    ),
  DISMISS: (state, action) => {
    const { id, reason } = action as { id: string; reason: DismissalReason }
    return updateSurvey(
      state,
      id,
      (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: reason,
      }),
      true
    )
  },
  SNOOZE: (state, action) =>
    updateSurvey(
      state,
      (action as { id: string }).id,
      (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isSnoozed: true,
        snoozeCount: e.snoozeCount + 1,
      }),
      true
    ),
  ANSWER: (state, action) => {
    const { id, questionId, value } = action as {
      id: string
      questionId: string
      value: AnswerValue
    }
    return handleAnswer(state, id, questionId, value)
  },
  NEXT_QUESTION: (state, action) =>
    updateSurvey(state, (action as { id: string }).id, (e) => ({
      ...e,
      currentStep: e.currentStep + 1,
    })),
  PREV_QUESTION: (state, action) =>
    updateSurvey(state, (action as { id: string }).id, (e) => ({
      ...e,
      currentStep: Math.max(0, e.currentStep - 1),
    })),
  COMPLETE: (state, action) =>
    updateSurvey(
      state,
      (action as { id: string }).id,
      (e) => ({
        ...e,
        isActive: false,
        isVisible: false,
        isCompleted: true,
        completedAt: new Date(),
      }),
      true
    ),
  RESET: (state, action) => {
    const surveys = new Map(state.surveys)
    surveys.set(
      (action as { id: string }).id,
      createInitialSurveyState((action as { id: string }).id)
    )
    return { ...state, surveys }
  },
  RESET_ALL: (state) => {
    const surveys = new Map<string, SurveyState>()
    for (const [id] of state.surveys) {
      surveys.set(id, createInitialSurveyState(id))
    }
    return { ...state, surveys, activeSurvey: null, queue: [] }
  },
}

function surveysReducer(state: SurveysReducerState, action: SurveysAction): SurveysReducerState {
  const handler = reducerHandlers[action.type]
  return handler ? handler(state, action) : state
}

// ── Context awareness ──────────────────────────────────────

function useOptionalTourContext(): { isActive: boolean } | null {
  try {
    const ctx = useTourContext()
    return ctx
  } catch {
    return null
  }
}

// ── Provider ───────────────────────────────────────────────

export function SurveysProvider({
  children,
  surveys: surveyConfigs = [],
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

  // Register configs on mount
  useEffect(() => {
    for (const config of surveyConfigs) {
      dispatch({ type: 'REGISTER', config })
    }
  }, [surveyConfigs])

  // Context awareness — suppress surveys when tour is active
  const tourContext = useOptionalTourContext()
  const isTourActive = tourContext?.isActive ?? false

  useEffect(() => {
    if (isTourActive && state.activeSurvey) {
      dispatch({ type: 'HIDE', id: state.activeSurvey })
    }
  }, [isTourActive, state.activeSurvey])

  // ── Action handlers with analytics callbacks ──

  const handleShow = useCallback(
    (id: string) => {
      if (isTourActive) return
      dispatch({ type: 'SHOW', id })
      onSurveyShow?.(id)
    },
    [isTourActive, onSurveyShow]
  )

  const handleHide = useCallback((id: string) => {
    dispatch({ type: 'HIDE', id })
  }, [])

  const handleDismiss = useCallback(
    (id: string, reason: DismissalReason = 'programmatic') => {
      dispatch({ type: 'DISMISS', id, reason })
      onSurveyDismiss?.(id, reason)
    },
    [onSurveyDismiss]
  )

  const handleSnooze = useCallback(
    (id: string) => {
      dispatch({ type: 'SNOOZE', id })
      onSurveySnooze?.(id)
    },
    [onSurveySnooze]
  )

  const handleAnswer = useCallback(
    (surveyId: string, questionId: string, value: AnswerValue) => {
      dispatch({ type: 'ANSWER', id: surveyId, questionId, value })
      onQuestionAnswered?.(surveyId, questionId, value)
      onSurveyAnswer?.(surveyId, questionId, value)
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
      const surveyState = state.surveys.get(surveyId)
      const responses = surveyState?.responses ?? new Map()

      dispatch({ type: 'COMPLETE', id: surveyId })
      onSurveyComplete?.(surveyId, responses)

      // Calculate score if survey has a scoreType configured
      const config = configsRef.current.find((s) => s.id === surveyId)
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
    [state.surveys, onSurveyComplete, onScoreCalculated]
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

  const canShow = useCallback(
    (id: string) => {
      if (isTourActive) return false
      const surveyState = state.surveys.get(id)
      if (!surveyState) return false
      if (surveyState.isCompleted || surveyState.isDismissed) return false
      return true
    },
    [isTourActive, state.surveys]
  )

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
      canShow,
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
      canShow,
    ]
  )

  return <SurveysContext.Provider value={value}>{children}</SurveysContext.Provider>
}
