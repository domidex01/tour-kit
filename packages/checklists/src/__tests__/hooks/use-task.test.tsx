import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useTask } from '../../hooks/use-task'
import type { ChecklistConfig } from '../../types'
import { createWrapper, mockBasicChecklist, mockNoDepsChecklist } from '../test-utils'

describe('useTask', () => {
  describe('context requirement', () => {
    it('throws when used outside ChecklistProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useTask('test', 'task-1'))
      }).toThrow('useChecklistContext must be used within a ChecklistProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('task retrieval', () => {
    it('returns task state for valid IDs', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'task-1'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.task).toBeDefined()
      expect(result.current.task?.config.id).toBe('task-1')
    })

    it('returns undefined for invalid task ID', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.task).toBeUndefined()
    })

    it('returns undefined for invalid checklist ID', () => {
      const { result } = renderHook(() => useTask('non-existent', 'task-1'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.task).toBeUndefined()
    })

    it('exists is true for valid task', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'task-1'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.exists).toBe(true)
    })

    it('exists is false for invalid task', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.exists).toBe(false)
    })
  })

  describe('task state', () => {
    it('isCompleted reflects task.completed', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.isCompleted).toBe(false)

      act(() => {
        result.current.complete()
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('isLocked reflects task.locked (dependencies)', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'task-2'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // task-2 depends on task-1, so it should be locked
      expect(result.current.isLocked).toBe(true)
    })

    it('isVisible reflects task.visible', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'task-1'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isVisible).toBe(true)
    })

    it('isLocked is true when dependencies unmet', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'task-2'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isLocked).toBe(true)
    })

    it('isLocked is false when dependencies met', () => {
      const checklistId = 'basic-checklist'
      const taskId = 'task-2'

      const { result: hookResult } = renderHook(
        () => ({
          task: useTask(checklistId, taskId),
          task1: useTask(checklistId, 'task-1'),
        }),
        {
          wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
        }
      )

      // Initially locked
      expect(hookResult.current.task.isLocked).toBe(true)

      // Complete the dependency
      act(() => {
        hookResult.current.task1.complete()
      })

      // Now should be unlocked
      expect(hookResult.current.task.isLocked).toBe(false)
    })
  })

  describe('actions', () => {
    it('complete() marks task as completed', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      act(() => {
        result.current.complete()
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('uncomplete() marks task as not completed', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      act(() => {
        result.current.complete()
      })

      act(() => {
        result.current.uncomplete()
      })

      expect(result.current.isCompleted).toBe(false)
    })

    it('execute() triggers task action', () => {
      const handler = vi.fn()
      const checklistWithCallback: ChecklistConfig = {
        id: 'callback-checklist',
        title: 'Callback Checklist',
        tasks: [
          {
            id: 'callback-task',
            title: 'Callback Task',
            action: { type: 'callback', handler },
          },
        ],
      }

      const { result } = renderHook(() => useTask('callback-checklist', 'callback-task'), {
        wrapper: createWrapper({ checklists: [checklistWithCallback] }),
      })

      act(() => {
        result.current.execute()
      })

      expect(handler).toHaveBeenCalled()
    })

    it('toggle() switches completion state', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.isCompleted).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCompleted).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCompleted).toBe(false)
    })

    it('toggle() completes incomplete task', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.isCompleted).toBe(false)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCompleted).toBe(true)
    })

    it('toggle() uncompletes completed task', () => {
      const { result } = renderHook(() => useTask('no-deps-checklist', 'task-a'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      act(() => {
        result.current.complete()
      })

      expect(result.current.isCompleted).toBe(true)

      act(() => {
        result.current.toggle()
      })

      expect(result.current.isCompleted).toBe(false)
    })
  })

  describe('default values for non-existent task', () => {
    it('returns false for isCompleted', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isCompleted).toBe(false)
    })

    it('returns true for isLocked (safe default)', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isLocked).toBe(true)
    })

    it('returns false for isVisible', () => {
      const { result } = renderHook(() => useTask('basic-checklist', 'non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isVisible).toBe(false)
    })
  })

  describe('memoization', () => {
    it('task state is memoized based on checklist and taskId', () => {
      const { result, rerender } = renderHook(() => useTask('basic-checklist', 'task-1'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const task1 = result.current.task
      rerender()
      const task2 = result.current.task

      // Same reference when nothing changed
      expect(task1).toBe(task2)
    })
  })
})
