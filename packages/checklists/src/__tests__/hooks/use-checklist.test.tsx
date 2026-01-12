import { act, renderHook } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { useChecklist } from '../../hooks/use-checklist'
import type { ChecklistConfig } from '../../types'
import {
  createWrapper,
  mockBasicChecklist,
  mockConditionalChecklist,
  mockNoDepsChecklist,
} from '../test-utils'

describe('useChecklist', () => {
  describe('context requirement', () => {
    it('throws when used outside ChecklistProvider', () => {
      // Suppress console.error for this test
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      expect(() => {
        renderHook(() => useChecklist('test'))
      }).toThrow('useChecklistContext must be used within a ChecklistProvider')

      consoleSpy.mockRestore()
    })
  })

  describe('checklist retrieval', () => {
    it('returns checklist state for valid ID', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.checklist).toBeDefined()
      expect(result.current.checklist?.config.id).toBe('basic-checklist')
    })

    it('returns undefined for invalid checklist ID', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.checklist).toBeUndefined()
    })

    it('exists is true for valid checklist', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.exists).toBe(true)
    })

    it('exists is false for invalid checklist', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.exists).toBe(false)
    })
  })

  describe('task filtering', () => {
    it('returns all tasks in tasks array', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.tasks.length).toBe(3)
    })

    it('returns only visible tasks in visibleTasks', () => {
      const { result } = renderHook(() => useChecklist('conditional-checklist'), {
        wrapper: createWrapper({
          checklists: [mockConditionalChecklist],
          context: { data: { showConditional: false } },
        }),
      })

      // Only 'always-visible' should be visible (user-based also hidden due to no role)
      expect(result.current.visibleTasks.length).toBe(1)
      expect(result.current.visibleTasks[0].config.id).toBe('always-visible')
    })

    it('filters tasks based on when() condition', () => {
      const { result } = renderHook(() => useChecklist('conditional-checklist'), {
        wrapper: createWrapper({
          checklists: [mockConditionalChecklist],
          context: {
            data: { showConditional: true },
            user: { role: 'admin' },
          },
        }),
      })

      // All tasks should be visible now
      expect(result.current.visibleTasks.length).toBe(3)
    })
  })

  describe('progress tracking', () => {
    it('returns correct progress.completed count', () => {
      const { result } = renderHook(() => useChecklist('no-deps-checklist'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.progress.completed).toBe(0)

      act(() => {
        result.current.completeTask('task-a')
      })

      expect(result.current.progress.completed).toBe(1)
    })

    it('returns correct progress.total count', () => {
      const { result } = renderHook(() => useChecklist('no-deps-checklist'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.progress.total).toBe(3)
    })

    it('returns correct progress.percentage', () => {
      const { result } = renderHook(() => useChecklist('no-deps-checklist'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.progress.percentage).toBe(0)

      act(() => {
        result.current.completeTask('task-a')
      })

      expect(result.current.progress.percentage).toBeCloseTo(33.33, 1)
    })

    it('returns correct progress.remaining', () => {
      const { result } = renderHook(() => useChecklist('no-deps-checklist'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.progress.remaining).toBe(3)

      act(() => {
        result.current.completeTask('task-a')
      })

      expect(result.current.progress.remaining).toBe(2)
    })
  })

  describe('state properties', () => {
    it('isComplete is true when all visible tasks done', () => {
      const { result } = renderHook(() => useChecklist('no-deps-checklist'), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      expect(result.current.isComplete).toBe(false)

      act(() => {
        result.current.completeTask('task-a')
        result.current.completeTask('task-b')
        result.current.completeTask('task-c')
      })

      expect(result.current.isComplete).toBe(true)
    })

    it('isDismissed reflects checklist dismissed state', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isDismissed).toBe(false)

      act(() => {
        result.current.dismiss()
      })

      expect(result.current.isDismissed).toBe(true)
    })

    it('isExpanded reflects checklist expanded state', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isExpanded).toBe(true)

      act(() => {
        result.current.setExpanded(false)
      })

      expect(result.current.isExpanded).toBe(false)
    })
  })

  describe('actions', () => {
    it('completeTask marks task as completed', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.completeTask('task-1')
      })

      const task = result.current.tasks.find((t) => t.config.id === 'task-1')
      expect(task?.completed).toBe(true)
    })

    it('uncompleteTask marks task as not completed', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.completeTask('task-1')
      })

      act(() => {
        result.current.uncompleteTask('task-1')
      })

      const task = result.current.tasks.find((t) => t.config.id === 'task-1')
      expect(task?.completed).toBe(false)
    })

    it('executeAction triggers task action', () => {
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

      const { result } = renderHook(() => useChecklist('callback-checklist'), {
        wrapper: createWrapper({ checklists: [checklistWithCallback] }),
      })

      act(() => {
        result.current.executeAction('callback-task')
      })

      expect(handler).toHaveBeenCalled()
    })

    it('dismiss dismisses the checklist', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.dismiss()
      })

      expect(result.current.isDismissed).toBe(true)
    })

    it('restore restores dismissed checklist', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.dismiss()
      })

      act(() => {
        result.current.restore()
      })

      expect(result.current.isDismissed).toBe(false)
    })

    it('toggleExpanded toggles expanded state', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isExpanded).toBe(true)

      act(() => {
        result.current.toggleExpanded()
      })

      expect(result.current.isExpanded).toBe(false)

      act(() => {
        result.current.toggleExpanded()
      })

      expect(result.current.isExpanded).toBe(true)
    })

    it('setExpanded sets expanded to specific value', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.setExpanded(false)
      })

      expect(result.current.isExpanded).toBe(false)

      act(() => {
        result.current.setExpanded(true)
      })

      expect(result.current.isExpanded).toBe(true)
    })

    it('reset clears all task completions', () => {
      const { result } = renderHook(() => useChecklist('basic-checklist'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.completeTask('task-1')
      })

      expect(result.current.tasks.find((t) => t.config.id === 'task-1')?.completed).toBe(true)

      act(() => {
        result.current.reset()
      })

      expect(result.current.tasks.every((t) => !t.completed)).toBe(true)
    })
  })

  describe('default values for non-existent checklist', () => {
    it('returns empty tasks array', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.tasks).toEqual([])
    })

    it('returns empty visibleTasks array', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.visibleTasks).toEqual([])
    })

    it('returns false for isComplete', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isComplete).toBe(false)
    })

    it('returns false for isDismissed', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isDismissed).toBe(false)
    })

    it('returns true for isExpanded', () => {
      const { result } = renderHook(() => useChecklist('non-existent'), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.isExpanded).toBe(true)
    })
  })
})
