import { describe, expect, it } from 'vitest'
import { SurveyPriorityQueue } from '../core/priority-queue'
import { SurveyScheduler } from '../core/scheduler'
import { DEFAULT_SURVEY_QUEUE_CONFIG } from '../types/queue'
import type { SurveyConfig, SurveyState } from '../types/survey'

function makeConfig(overrides: Partial<SurveyConfig> = {}): SurveyConfig {
  return {
    id: 'test',
    type: 'nps',
    displayMode: 'modal',
    questions: [],
    ...overrides,
  }
}

function makeState(overrides: Partial<SurveyState> = {}): SurveyState {
  return {
    id: 'test',
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
    ...overrides,
  }
}

describe('SurveyPriorityQueue', () => {
  it('orders by priority weight then sequence', () => {
    const q = new SurveyPriorityQueue(DEFAULT_SURVEY_QUEUE_CONFIG)
    q.enqueue('a', 'low')
    q.enqueue('b', 'critical')
    q.enqueue('c', 'normal')
    expect(q.getIds()).toEqual(['b', 'c', 'a'])
  })

  it('fifo order', () => {
    const q = new SurveyPriorityQueue({ ...DEFAULT_SURVEY_QUEUE_CONFIG, priorityOrder: 'fifo' })
    q.enqueue('a', 'critical')
    q.enqueue('b', 'low')
    q.enqueue('c', 'high')
    expect(q.getIds()).toEqual(['a', 'b', 'c'])
  })

  it('lifo order', () => {
    const q = new SurveyPriorityQueue({ ...DEFAULT_SURVEY_QUEUE_CONFIG, priorityOrder: 'lifo' })
    q.enqueue('a', 'low')
    q.enqueue('b', 'low')
    q.enqueue('c', 'low')
    expect(q.getIds()).toEqual(['c', 'b', 'a'])
  })

  it('remove and peek', () => {
    const q = new SurveyPriorityQueue(DEFAULT_SURVEY_QUEUE_CONFIG)
    q.enqueue('a', 'low')
    q.enqueue('b', 'low')
    expect(q.has('a')).toBe(true)
    expect(q.remove('a')).toBe(true)
    expect(q.has('a')).toBe(false)
    expect(q.peek()?.id).toBe('b')
  })
})

describe('SurveyScheduler.canShow', () => {
  it('rejects dismissed, completed, or audience mismatches', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    expect(s.canShow(makeConfig(), makeState({ isDismissed: true }))).toBe(false)
    expect(s.canShow(makeConfig(), makeState({ isCompleted: true }))).toBe(false)
    expect(
      s.canShow(
        makeConfig({
          audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
        }),
        makeState(),
        { plan: 'free' }
      )
    ).toBe(false)
    expect(s.canShow(makeConfig(), makeState())).toBe(true)
  })

  it('respects frequency rule', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    expect(s.canShow(makeConfig({ frequency: 'once' }), makeState({ viewCount: 1 }))).toBe(false)
  })
})

describe('SurveyScheduler enqueue/getNext', () => {
  it('dequeues in priority order', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    s.enqueue(makeConfig({ id: 'a', priority: 'low' }))
    s.enqueue(makeConfig({ id: 'b', priority: 'critical' }))
    s.enqueue(makeConfig({ id: 'c', priority: 'normal' }))
    expect(s.getNext()).toBe('b')
    expect(s.getNext()).toBe('c')
    expect(s.getNext()).toBe('a')
    expect(s.getNext()).toBeUndefined()
  })

  it('tracks active count and max concurrent', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    expect(s.canShowMore()).toBe(true)
    s.markActive()
    expect(s.canShowMore()).toBe(false)
    s.markInactive()
    expect(s.canShowMore()).toBe(true)
  })
})

describe('SurveyScheduler queue introspection & lifecycle', () => {
  it('peekNext, isQueued, getQueuedIds, queueSize and remove reflect queue contents', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    expect(s.queueSize).toBe(0)
    expect(s.peekNext()).toBeUndefined()

    s.enqueue(makeConfig({ id: 'a', priority: 'normal' }))
    s.enqueue(makeConfig({ id: 'b', priority: 'critical' }))

    expect(s.queueSize).toBe(2)
    expect(s.peekNext()).toBe('b') // critical sits at the head, not dequeued
    expect(s.queueSize).toBe(2)
    expect(s.isQueued('a')).toBe(true)
    expect(s.isQueued('missing')).toBe(false)
    expect(s.getQueuedIds()).toEqual(['b', 'a'])

    expect(s.remove('a')).toBe(true)
    expect(s.isQueued('a')).toBe(false)
    expect(s.remove('a')).toBe(false)
    expect(s.queueSize).toBe(1)
  })

  it('currentActiveCount, resetActive and clearQueue reset lifecycle state', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    s.markActive()
    s.markActive()
    expect(s.currentActiveCount).toBe(2)
    s.resetActive()
    expect(s.currentActiveCount).toBe(0)

    s.enqueue(makeConfig({ id: 'x' }))
    expect(s.queueSize).toBe(1)
    s.clearQueue()
    expect(s.queueSize).toBe(0)
  })

  it('exposes config getters and updateConfig swaps them', () => {
    const s = new SurveyScheduler(DEFAULT_SURVEY_QUEUE_CONFIG)
    expect(s.delayBetween).toBe(DEFAULT_SURVEY_QUEUE_CONFIG.delayBetween)
    expect(s.autoShow).toBe(DEFAULT_SURVEY_QUEUE_CONFIG.autoShow)
    expect(s.stackBehavior).toBe(DEFAULT_SURVEY_QUEUE_CONFIG.stackBehavior)

    s.updateConfig({
      ...DEFAULT_SURVEY_QUEUE_CONFIG,
      delayBetween: 9999,
      autoShow: !DEFAULT_SURVEY_QUEUE_CONFIG.autoShow,
    })
    expect(s.delayBetween).toBe(9999)
    expect(s.autoShow).toBe(!DEFAULT_SURVEY_QUEUE_CONFIG.autoShow)
  })
})
