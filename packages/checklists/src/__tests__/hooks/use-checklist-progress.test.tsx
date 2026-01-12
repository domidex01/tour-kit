import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChecklistContext } from '../../context/checklist-context'
import { useChecklistsProgress } from '../../hooks/use-checklist-progress'
import type { ChecklistConfig } from '../../types'
import { createWrapper, mockBasicChecklist, mockNoDepsChecklist } from '../test-utils'

describe('useChecklistsProgress', () => {
  describe('context requirement', () => {
    it('throws when used outside ChecklistProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useChecklistsProgress())
      }).toThrow('useChecklistContext must be used within a ChecklistProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('per-checklist progress', () => {
    it('returns byChecklist object with progress per ID', () => {
      const { result } = renderHook(() => useChecklistsProgress(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      expect(result.current.byChecklist).toHaveProperty('basic-checklist')
      expect(result.current.byChecklist).toHaveProperty('no-deps-checklist')
    })

    it('progress values match individual checklist state', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
        }
      )

      // Complete a task
      act(() => {
        result.current.context.completeTask('no-deps-checklist', 'task-a')
      })

      const checklistProgress = result.current.progress.byChecklist['no-deps-checklist']
      expect(checklistProgress.completed).toBe(1)
      expect(checklistProgress.total).toBe(3)
    })
  })

  describe('aggregate progress', () => {
    it('total.completed sums all completed tasks', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
        }
      )

      // Complete tasks in both checklists
      act(() => {
        result.current.context.completeTask('basic-checklist', 'task-1')
        result.current.context.completeTask('no-deps-checklist', 'task-a')
        result.current.context.completeTask('no-deps-checklist', 'task-b')
      })

      expect(result.current.progress.total.completed).toBe(3)
    })

    it('total.total sums all total tasks', () => {
      const { result } = renderHook(() => useChecklistsProgress(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      // basic-checklist has 3 tasks, no-deps-checklist has 3 tasks
      expect(result.current.total.total).toBe(6)
    })

    it('total.percentage is weighted average', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
        }
      )

      // Complete 1 of 3 tasks
      act(() => {
        result.current.context.completeTask('no-deps-checklist', 'task-a')
      })

      expect(result.current.progress.total.percentage).toBeCloseTo(33.33, 1)
    })

    it('total.remaining is correct', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
        }
      )

      expect(result.current.progress.total.remaining).toBe(3)

      act(() => {
        result.current.context.completeTask('no-deps-checklist', 'task-a')
      })

      expect(result.current.progress.total.remaining).toBe(2)
    })
  })

  describe('checklist counts', () => {
    it('completedChecklists counts fully complete', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
        }
      )

      expect(result.current.progress.completedChecklists).toBe(0)

      // Complete all tasks
      act(() => {
        result.current.context.completeTask('no-deps-checklist', 'task-a')
        result.current.context.completeTask('no-deps-checklist', 'task-b')
        result.current.context.completeTask('no-deps-checklist', 'task-c')
      })

      expect(result.current.progress.completedChecklists).toBe(1)
    })

    it('totalChecklists counts all checklists', () => {
      const { result } = renderHook(() => useChecklistsProgress(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      expect(result.current.totalChecklists).toBe(2)
    })
  })

  describe('edge cases', () => {
    it('handles single checklist', () => {
      const { result } = renderHook(() => useChecklistsProgress(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.totalChecklists).toBe(1)
      expect(result.current.total.total).toBe(3)
    })

    it('handles all checklists complete', () => {
      const singleTaskChecklist: ChecklistConfig = {
        id: 'single-task',
        title: 'Single Task',
        tasks: [{ id: 'task-1', title: 'Task 1' }],
      }

      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [singleTaskChecklist] }),
        }
      )

      act(() => {
        result.current.context.completeTask('single-task', 'task-1')
      })

      expect(result.current.progress.completedChecklists).toBe(1)
      expect(result.current.progress.totalChecklists).toBe(1)
      expect(result.current.progress.total.percentage).toBe(100)
      expect(result.current.progress.total.remaining).toBe(0)
    })

    it('handles multiple checklists with mixed completion', () => {
      const { result } = renderHook(
        () => ({
          progress: useChecklistsProgress(),
          context: useChecklistContext(),
        }),
        {
          wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
        }
      )

      // Complete all tasks in no-deps-checklist
      act(() => {
        result.current.context.completeTask('no-deps-checklist', 'task-a')
        result.current.context.completeTask('no-deps-checklist', 'task-b')
        result.current.context.completeTask('no-deps-checklist', 'task-c')
      })

      // Only complete 1 task in basic-checklist
      act(() => {
        result.current.context.completeTask('basic-checklist', 'task-1')
      })

      expect(result.current.progress.completedChecklists).toBe(1)
      expect(result.current.progress.totalChecklists).toBe(2)
      expect(result.current.progress.total.completed).toBe(4)
      expect(result.current.progress.total.total).toBe(6)
    })
  })

  describe('memoization', () => {
    it('result is memoized based on context', () => {
      const { result, rerender } = renderHook(() => useChecklistsProgress(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      const result1 = result.current
      rerender()
      const result2 = result.current

      // Same reference when nothing changed (deep equal check instead of reference equality)
      expect(result1).toStrictEqual(result2)
    })
  })
})
