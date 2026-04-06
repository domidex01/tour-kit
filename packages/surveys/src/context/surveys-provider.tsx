import {
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useRef,
} from 'react'
import { useTourContext } from '@tour-kit/core'
import type { AnswerValue } from '../types/question'
import type { CESResult, CSATResult, NPSResult } from '../types/scoring'
import type { DismissalReason, SurveyConfig, SurveyState } from '../types/survey'
import type { SurveysContextValue, SurveysProviderProps } from '../types/context'
import { calculateNPS, calculateCSAT, calculateCES } from '../core/scoring'
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

function surveysReducer(
  state: SurveysReducerState,
  action: SurveysAction,
): SurveysReducerState {
  switch (action.type) {
    case 'REGISTER': {
      const surveys = new Map(state.surveys)
      if (!surveys.has(action.config.id)) {
        surveys.set(action.config.id, createInitialSurveyState(action.config.id))
      }
      return { ...state, surveys }
    }

    case 'UNREGISTER': {
      const surveys = new Map(state.surveys)
      surveys.delete(action.id)
      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
        queue: state.queue.filter((id) => id !== action.id),
      }
    }

    case 'SHOW': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      if (state.activeSurvey && state.activeSurvey !== action.id) {
        // Queue it if another survey is active
        return {
          ...state,
          queue: [...state.queue, action.id],
        }
      }

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
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        isActive: false,
        isVisible: false,
      })

      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
      }
    }

    case 'DISMISS': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        isActive: false,
        isVisible: false,
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: action.reason,
      })

      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
      }
    }

    case 'SNOOZE': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        isActive: false,
        isVisible: false,
        isSnoozed: true,
        snoozeCount: existing.snoozeCount + 1,
      })

      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
      }
    }

    case 'ANSWER': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      const responses = new Map(existing.responses)
      responses.set(action.questionId, action.value)

      surveys.set(action.id, { ...existing, responses })

      return { ...state, surveys }
    }

    case 'NEXT_QUESTION': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        currentStep: existing.currentStep + 1,
      })

      return { ...state, surveys }
    }

    case 'PREV_QUESTION': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        currentStep: Math.max(0, existing.currentStep - 1),
      })

      return { ...state, surveys }
    }

    case 'COMPLETE': {
      const surveys = new Map(state.surveys)
      const existing = surveys.get(action.id)
      if (!existing) return state

      surveys.set(action.id, {
        ...existing,
        isActive: false,
        isVisible: false,
        isCompleted: true,
        completedAt: new Date(),
      })

      return {
        ...state,
        surveys,
        activeSurvey: state.activeSurvey === action.id ? null : state.activeSurvey,
      }
    }

    case 'RESET': {
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

    default:
      return state
  }
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
    [isTourActive, onSurveyShow],
  )

  const handleHide = useCallback((id: string) => {
    dispatch({ type: 'HIDE', id })
  }, [])

  const handleDismiss = useCallback(
    (id: string, reason: DismissalReason = 'programmatic') => {
      dispatch({ type: 'DISMISS', id, reason })
      onSurveyDismiss?.(id, reason)
    },
    [onSurveyDismiss],
  )

  const handleSnooze = useCallback(
    (id: string) => {
      dispatch({ type: 'SNOOZE', id })
      onSurveySnooze?.(id)
    },
    [onSurveySnooze],
  )

  const handleAnswer = useCallback(
    (surveyId: string, questionId: string, value: AnswerValue) => {
      dispatch({ type: 'ANSWER', id: surveyId, questionId, value })
      onQuestionAnswered?.(surveyId, questionId, value)
      onSurveyAnswer?.(surveyId, questionId, value)
    },
    [onQuestionAnswered, onSurveyAnswer],
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
          (v): v is number => typeof v === 'number',
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
    [state.surveys, onSurveyComplete, onScoreCalculated],
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

  const getState = useCallback(
    (id: string) => state.surveys.get(id),
    [state.surveys],
  )

  const getConfig = useCallback(
    (id: string) => configsRef.current.find((s) => s.id === id),
    [],
  )

  const canShow = useCallback(
    (id: string) => {
      if (isTourActive) return false
      const surveyState = state.surveys.get(id)
      if (!surveyState) return false
      if (surveyState.isCompleted || surveyState.isDismissed) return false
      return true
    },
    [isTourActive, state.surveys],
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
    ],
  )

  return <SurveysContext.Provider value={value}>{children}</SurveysContext.Provider>
}
