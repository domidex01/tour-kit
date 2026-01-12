import { describe, expect, it } from 'vitest'
import { calculateProgress, getLockedTasks, getNextTask } from '../../utils/progress'
import { createMockChecklistState, createMockTaskState } from '../test-utils'

describe('progress', () => {
  describe('calculateProgress', () => {
    it('returns 0% for checklist with no completed tasks', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: false }),
          createMockTaskState({ config: { id: 't2', title: 'T2' }, completed: false }),
          createMockTaskState({ config: { id: 't3', title: 'T3' }, completed: false }),
        ],
      })

      const progress = calculateProgress(checklist)

      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(3)
      expect(progress.percentage).toBe(0)
      expect(progress.remaining).toBe(3)
    })

    it('returns 100% for fully completed checklist', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: true }),
          createMockTaskState({ config: { id: 't2', title: 'T2' }, completed: true }),
        ],
      })

      const progress = calculateProgress(checklist)

      expect(progress.completed).toBe(2)
      expect(progress.total).toBe(2)
      expect(progress.percentage).toBe(100)
      expect(progress.remaining).toBe(0)
    })

    it('calculates correct percentage for partial completion', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: true }),
          createMockTaskState({ config: { id: 't2', title: 'T2' }, completed: false }),
          createMockTaskState({ config: { id: 't3', title: 'T3' }, completed: false }),
          createMockTaskState({ config: { id: 't4', title: 'T4' }, completed: true }),
        ],
      })

      const progress = calculateProgress(checklist)

      expect(progress.completed).toBe(2)
      expect(progress.total).toBe(4)
      expect(progress.percentage).toBe(50)
      expect(progress.remaining).toBe(2)
    })

    it('handles checklist with single task', () => {
      const checklistNotComplete = createMockChecklistState({
        tasks: [createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: false })],
      })

      const progressNotComplete = calculateProgress(checklistNotComplete)
      expect(progressNotComplete.completed).toBe(0)
      expect(progressNotComplete.total).toBe(1)
      expect(progressNotComplete.percentage).toBe(0)

      const checklistComplete = createMockChecklistState({
        tasks: [createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: true })],
      })

      const progressComplete = calculateProgress(checklistComplete)
      expect(progressComplete.completed).toBe(1)
      expect(progressComplete.total).toBe(1)
      expect(progressComplete.percentage).toBe(100)
    })

    it('only counts visible tasks in calculation', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: true,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: true,
            visible: false,
          }),
          createMockTaskState({
            config: { id: 't3', title: 'T3' },
            completed: false,
            visible: true,
          }),
        ],
      })

      const progress = calculateProgress(checklist)

      // Only visible tasks count (t1 and t3)
      expect(progress.completed).toBe(1)
      expect(progress.total).toBe(2)
      expect(progress.percentage).toBe(50)
      expect(progress.remaining).toBe(1)
    })

    it('handles checklist where all tasks are hidden', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: true,
            visible: false,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: false,
            visible: false,
          }),
        ],
      })

      const progress = calculateProgress(checklist)

      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(0)
      expect(progress.percentage).toBe(0)
      expect(progress.remaining).toBe(0)
    })

    it('returns 0 remaining when all complete', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({ config: { id: 't1', title: 'T1' }, completed: true }),
          createMockTaskState({ config: { id: 't2', title: 'T2' }, completed: true }),
        ],
      })

      const progress = calculateProgress(checklist)

      expect(progress.remaining).toBe(0)
    })
  })

  describe('getNextTask', () => {
    it('returns first visible, incomplete, unlocked task', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: true,
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: false,
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't3', title: 'T3' },
            completed: false,
            locked: false,
            visible: true,
          }),
        ],
      })

      const nextTask = getNextTask(checklist)

      expect(nextTask?.config.id).toBe('t2')
    })

    it('returns undefined when all tasks complete', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: true,
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: true,
            locked: false,
            visible: true,
          }),
        ],
      })

      const nextTask = getNextTask(checklist)

      expect(nextTask).toBeUndefined()
    })

    it('returns undefined when all incomplete tasks are locked', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: true,
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: false,
            locked: true,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't3', title: 'T3' },
            completed: false,
            locked: true,
            visible: true,
          }),
        ],
      })

      const nextTask = getNextTask(checklist)

      expect(nextTask).toBeUndefined()
    })

    it('skips hidden tasks', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            completed: false,
            locked: false,
            visible: false,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            completed: false,
            locked: false,
            visible: true,
          }),
        ],
      })

      const nextTask = getNextTask(checklist)

      expect(nextTask?.config.id).toBe('t2')
    })

    it('returns undefined for empty checklist', () => {
      const checklist = createMockChecklistState({
        tasks: [],
      })

      const nextTask = getNextTask(checklist)

      expect(nextTask).toBeUndefined()
    })
  })

  describe('getLockedTasks', () => {
    it('returns all locked visible tasks', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            locked: true,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't3', title: 'T3' },
            locked: true,
            visible: true,
          }),
        ],
      })

      const lockedTasks = getLockedTasks(checklist)

      expect(lockedTasks.length).toBe(2)
      expect(lockedTasks.map((t) => t.config.id)).toEqual(['t2', 't3'])
    })

    it('returns empty array when no tasks locked', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            locked: false,
            visible: true,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            locked: false,
            visible: true,
          }),
        ],
      })

      const lockedTasks = getLockedTasks(checklist)

      expect(lockedTasks).toEqual([])
    })

    it('excludes hidden locked tasks', () => {
      const checklist = createMockChecklistState({
        tasks: [
          createMockTaskState({
            config: { id: 't1', title: 'T1' },
            locked: true,
            visible: false,
          }),
          createMockTaskState({
            config: { id: 't2', title: 'T2' },
            locked: true,
            visible: true,
          }),
        ],
      })

      const lockedTasks = getLockedTasks(checklist)

      expect(lockedTasks.length).toBe(1)
      expect(lockedTasks[0].config.id).toBe('t2')
    })

    it('returns empty array for empty checklist', () => {
      const checklist = createMockChecklistState({
        tasks: [],
      })

      const lockedTasks = getLockedTasks(checklist)

      expect(lockedTasks).toEqual([])
    })
  })
})
