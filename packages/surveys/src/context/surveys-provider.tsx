'use client'

import { createStorageAdapter, useTourContextOptional } from '@tour-kit/core'
import { LicenseGate } from '@tour-kit/license'
import { type ReactNode, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSyncExternalStore } from 'react'
import type { StepValidation } from '../lib/surveys-engine/create-surveys-engine'
import { createSurveysHandle } from '../lib/surveys-engine/create-surveys-handle'
import type { SurveysContextValue, SurveysProviderProps } from '../types/context'
import type { AnswerValue } from '../types/question'
import type { DismissalReason, SurveyConfig } from '../types/survey'
import { SurveysContext } from './surveys-context'

/**
 * v3 Phase 3 — this provider is a BINDING over `@tour-kit/surveys/engine`.
 *
 * 401 lines of reducer, persistence and fatigue gates now live in
 * `lib/surveys-engine/` and run with no React at all. What is left is the four
 * things only React can do: build the storage adapter and read the tour context
 * (two things the engine cannot), subscribe a tree to the engine's snapshot,
 * forward prop changes as verbs, and wrap in the licence gate.
 *
 * The storage adapter is built HERE and passed in, not resolved in the engine.
 * Six existing suites stub `createStorageAdapter` through `vi.mock` on core's
 * main barrel, and `vi.mock` does not intercept the `/engine` subpath — an
 * engine that resolved its own would leave all six silently running against
 * real jsdom `localStorage`, still green and no longer testing anything.
 */
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
  const storage = useMemo(() => {
    if (storageProp === null) return null
    return createStorageAdapter(storageProp ?? 'localStorage')
  }, [storageProp])

  // The engine reads these through stable callbacks, so a changed handler never
  // rebuilds it.
  const live = useRef({
    configs: surveyConfigs,
    onSurveyShow,
    onSurveyDismiss,
    onSurveyComplete,
    onSurveyAnswer,
    onSurveySnooze,
    onQuestionAnswered,
    onScoreCalculated,
  })
  live.current = {
    configs: surveyConfigs,
    onSurveyShow,
    onSurveyDismiss,
    onSurveyComplete,
    onSurveyAnswer,
    onSurveySnooze,
    onQuestionAnswered,
    onScoreCalculated,
  }

  /**
   * Which question sits at a step, and what its validator says.
   *
   * `QuestionConfig` carries `MediaSlotProps`, so it cannot enter the engine —
   * but the ORDER (validate, record or clear the error, advance only on a pass)
   * is engine logic and stays there. This is the seam between the two.
   */
  const validateStep = useCallback(
    (
      surveyId: string,
      step: number,
      responses: Map<string, AnswerValue>
    ): StepValidation | null => {
      const config = live.current.configs.find((c) => c.id === surveyId)
      const question = config?.questions?.[step]
      if (!question?.validation) return null
      // `value` is `AnswerValue | undefined` — undefined when the question is
      // unanswered, which is exactly the case `validation` exists to catch (a
      // required field). The cast bridges to the public `(value: AnswerValue)`
      // signature, which can't be widened without a breaking change to that
      // frozen shape. Validation authors must handle a falsy value.
      const value = responses.get(question.id)
      return { questionId: question.id, error: question.validation(value as AnswerValue) }
    },
    []
  )

  // Construct the HANDLE in render (inert) but never the engine: `createHandle`
  // builds that on the first verb, which is what keeps StrictMode's double
  // render from producing two engines.
  const [handle] = useState(() =>
    createSurveysHandle<SurveyConfig>({
      surveys: surveyConfigs,
      queueConfig,
      storage,
      storageKey,
      userContext,
      globalCooldownDays,
      samplingRate,
      maxPerSession,
      validateStep,
      onShow: (id) => live.current.onSurveyShow?.(id),
      onDismiss: (id, reason) => live.current.onSurveyDismiss?.(id, reason),
      onSnooze: (id) => live.current.onSurveySnooze?.(id),
      onAnswer: (surveyId, questionId, value) => {
        live.current.onQuestionAnswered?.(surveyId, questionId, value)
        live.current.onSurveyAnswer?.(surveyId, questionId, value)
      },
      onComplete: (surveyId, responses) => live.current.onSurveyComplete?.(surveyId, responses),
      onScoreCalculated: (surveyId, type, result) =>
        live.current.onScoreCalculated?.(surveyId, type, result),
    })
  )

  const state = useSyncExternalStore(handle.subscribe, handle.getState, handle.getState)

  useEffect(() => {
    void handle.ensure().boot()
    return () => handle.release()
  }, [handle])

  // Prop → verb, guarded against the first run: `boot()` already registered
  // these exact configs, so an unguarded effect would re-register on mount.
  const ids = useMemo(() => surveyConfigs.map((c) => c.id).join('|'), [surveyConfigs])
  const mounted = useRef(false)
  // biome-ignore lint/correctness/useExhaustiveDependencies: `ids` is a stable re-run trigger; the body reads the mutable ref.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    handle.ensure().setSurveys(live.current.configs)
  }, [handle, ids])

  const synced = useRef(false)
  useEffect(() => {
    if (!synced.current) {
      synced.current = true
      return
    }
    const engine = handle.ensure()
    engine.setUserContext(userContext)
    if (queueConfig) engine.setQueueConfig(queueConfig)
  }, [handle, userContext, queueConfig])

  // The engine cannot read a React context, so the binding forwards the signal
  // (plan Decision 7). The coupling stops being implicit, and a Vue consumer
  // can wire the same thing from its own tour state.
  const isTourActive = useTourContextOptional()?.isActive ?? false
  useEffect(() => {
    handle.ensure().setTourActive(isTourActive)
  }, [handle, isTourActive])

  const verbs = useMemo(
    () => ({
      register: (config: SurveyConfig) => handle.ensure().register(config),
      unregister: (id: string) => handle.ensure().unregister(id),
      show: (id: string) => handle.ensure().show(id),
      hide: (id: string) => handle.ensure().hide(id),
      dismiss: (id: string, reason: DismissalReason = 'programmatic') =>
        handle.ensure().dismiss(id, reason),
      snooze: (id: string) => handle.ensure().snooze(id),
      answer: (surveyId: string, questionId: string, value: AnswerValue) =>
        handle.ensure().answer(surveyId, questionId, value),
      nextQuestion: (surveyId: string) => handle.ensure().nextQuestion(surveyId),
      prevQuestion: (surveyId: string) => handle.ensure().prevQuestion(surveyId),
      complete: (surveyId: string) => handle.ensure().complete(surveyId),
      reset: (id: string) => handle.ensure().reset(id),
      resetAll: () => handle.ensure().resetAll(),
      getConfig: (id: string) => handle.ensure().getConfig(id),
      canShow: (id: string) => handle.ensure().canShow(id),
    }),
    [handle]
  )

  const value = useMemo<SurveysContextValue>(
    () => ({
      surveys: state.surveys,
      activeSurvey: state.activeSurvey,
      queue: state.queue,
      ...verbs,
      getState: (id: string) => state.surveys.get(id),
      getValidationError: (id: string, questionId: string) =>
        state.surveys.get(id)?.validationErrors.get(questionId),
    }),
    [state, verbs]
  )

  return (
    <LicenseGate require="pro">
      <SurveysContext.Provider value={value}>{children}</SurveysContext.Provider>
    </LicenseGate>
  )
}
