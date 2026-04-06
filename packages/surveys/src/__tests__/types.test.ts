import { describe, it, expect, expectTypeOf } from 'vitest'
import type {
  SurveyType,
  DisplayMode,
  SurveyPriority,
  FrequencyRule,
  DismissalReason,
  SurveyConfig,
  SurveyState,
  QuestionType,
  QuestionConfig,
  AnswerValue,
  SkipLogic,
  RatingScale,
  SelectOption,
  NPSResult,
  CSATResult,
  CESResult,
  SurveyEvent,
  SurveyEventType,
  SurveyShownEvent,
  SurveyDismissedEvent,
  SurveyCompletedEvent,
  SurveyQuestionAnsweredEvent,
  SurveyScoreCalculatedEvent,
  SurveysContextValue,
  SurveysProviderProps,
  PriorityOrder,
  StackBehavior,
  SurveyQueueConfig,
  SurveyQueueItem,
} from '../types'
import { DEFAULT_SURVEY_QUEUE_CONFIG } from '../types'

describe('Survey type definitions compile', () => {
  it('SurveyType accepts all valid literals', () => {
    const nps: SurveyType = 'nps'
    const csat: SurveyType = 'csat'
    const ces: SurveyType = 'ces'
    const custom: SurveyType = 'custom'

    expect(nps).toBe('nps')
    expect(csat).toBe('csat')
    expect(ces).toBe('ces')
    expect(custom).toBe('custom')
  })

  it('DisplayMode accepts all valid literals', () => {
    const modes: DisplayMode[] = ['popover', 'modal', 'slideout', 'banner', 'inline']
    expect(modes).toHaveLength(5)
  })

  it('FrequencyRule accepts both string literals and tagged objects', () => {
    const rules: FrequencyRule[] = [
      'once',
      'session',
      'always',
      { type: 'times', count: 3 },
      { type: 'interval', days: 7 },
    ]

    expect(rules[0]).toBe('once')
    expect(rules[3]).toEqual({ type: 'times', count: 3 })
    expect(rules[4]).toEqual({ type: 'interval', days: 7 })
  })

  it('QuestionType and AnswerValue cover all input types', () => {
    const types: QuestionType[] = [
      'rating', 'text', 'textarea', 'single-select', 'multi-select', 'boolean',
    ]
    expect(types).toHaveLength(6)

    const str: AnswerValue = 'hello'
    const num: AnswerValue = 42
    const bool: AnswerValue = true
    const arr: AnswerValue = ['a', 'b']

    expect(str).toBe('hello')
    expect(num).toBe(42)
    expect(bool).toBe(true)
    expect(arr).toEqual(['a', 'b'])
  })

  it('scoring result types have domain-specific fields', () => {
    expectTypeOf<NPSResult>().toHaveProperty('promoters')
    expectTypeOf<NPSResult>().toHaveProperty('passives')
    expectTypeOf<NPSResult>().toHaveProperty('detractors')
    expectTypeOf<NPSResult>().toHaveProperty('promoterPct')

    expectTypeOf<CSATResult>().toHaveProperty('positive')
    expectTypeOf<CSATResult>().toHaveProperty('negative')
    expectTypeOf<CSATResult>().toHaveProperty('threshold')

    expectTypeOf<CESResult>().toHaveProperty('easy')
    expectTypeOf<CESResult>().toHaveProperty('difficult')
    expectTypeOf<CESResult>().toHaveProperty('neutral')
  })

  it('SurveyEvent discriminated union narrows on type field', () => {
    const shownEvent: SurveyShownEvent = {
      type: 'survey_shown',
      surveyId: 'test',
      surveyType: 'nps',
      displayMode: 'modal',
      timestamp: Date.now(),
      viewCount: 1,
      fromQueue: false,
    }

    const dismissedEvent: SurveyDismissedEvent = {
      type: 'survey_dismissed',
      surveyId: 'test',
      surveyType: 'nps',
      displayMode: 'modal',
      timestamp: Date.now(),
      reason: 'close_button',
      viewDuration: 5000,
    }

    // Verify discriminated union assignment
    const event1: SurveyEvent = shownEvent
    const event2: SurveyEvent = dismissedEvent

    expect(event1.type).toBe('survey_shown')
    expect(event2.type).toBe('survey_dismissed')
  })

  it('DEFAULT_SURVEY_QUEUE_CONFIG has expected default values', () => {
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.maxConcurrent).toBe(1)
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.priorityOrder).toBe('priority')
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.stackBehavior).toBe('queue')
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.delayBetween).toBe(500)
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.autoShow).toBe(true)
    expect(DEFAULT_SURVEY_QUEUE_CONFIG.priorityWeights).toEqual({
      critical: 1000,
      high: 100,
      normal: 10,
      low: 1,
    })
  })

  it('all remaining type imports compile correctly', () => {
    expectTypeOf<SurveyPriority>().toBeString()
    expectTypeOf<DismissalReason>().toBeString()
    expectTypeOf<SurveyConfig>().toHaveProperty('id')
    expectTypeOf<SurveyState>().toHaveProperty('isActive')
    expectTypeOf<QuestionConfig>().toHaveProperty('type')
    expectTypeOf<SkipLogic>().toHaveProperty('questionId')
    expectTypeOf<RatingScale>().toHaveProperty('min')
    expectTypeOf<SelectOption>().toHaveProperty('value')
    expectTypeOf<SurveyEventType>().toBeString()
    expectTypeOf<SurveyCompletedEvent>().toHaveProperty('completionRate')
    expectTypeOf<SurveyQuestionAnsweredEvent>().toHaveProperty('questionId')
    expectTypeOf<SurveyScoreCalculatedEvent>().toHaveProperty('scoreType')
    expectTypeOf<SurveysContextValue>().toHaveProperty('register')
    expectTypeOf<SurveysProviderProps>().toHaveProperty('children')
    expectTypeOf<PriorityOrder>().toBeString()
    expectTypeOf<StackBehavior>().toBeString()
    expectTypeOf<SurveyQueueConfig>().toHaveProperty('maxConcurrent')
    expectTypeOf<SurveyQueueItem>().toHaveProperty('id')
  })
})
