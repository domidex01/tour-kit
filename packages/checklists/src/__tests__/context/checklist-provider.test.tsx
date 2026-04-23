import { act, renderHook, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { useChecklistContext } from '../../context/checklist-context'
import type { ChecklistConfig } from '../../types'
import {
  createWrapper,
  createWrapperWithCallbacks,
  mockActionsChecklist,
  mockBasicChecklist,
  mockConditionalChecklist,
  mockDismissibleChecklist,
  mockNoDepsChecklist,
  mockWindowLocation,
  mockWindowOpen,
} from '../test-utils'

describe('ChecklistProvider', () => {
  describe('initialization', () => {
    it('creates initial state from checklist configs', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      expect(result.current.checklists.size).toBe(1)
      expect(result.current.checklists.has('basic-checklist')).toBe(true)
    })

    it('all tasks start as not completed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.every((t) => !t.completed)).toBe(true)
    })

    it('tasks with unmet dependencies start as locked', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const checklist = result.current.getChecklist('basic-checklist')
      // task-1 has no deps, should be unlocked
      expect(checklist?.tasks.find((t) => t.config.id === 'task-1')?.locked).toBe(false)
      // task-2 depends on task-1, should be locked
      expect(checklist?.tasks.find((t) => t.config.id === 'task-2')?.locked).toBe(true)
      // task-3 depends on task-2, should be locked
      expect(checklist?.tasks.find((t) => t.config.id === 'task-3')?.locked).toBe(true)
    })

    it('tasks with met dependencies start as unlocked', () => {
      // For a checklist with no dependencies, all should be unlocked
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      const checklist = result.current.getChecklist('no-deps-checklist')
      expect(checklist?.tasks.every((t) => !t.locked)).toBe(true)
    })

    it('all checklists start as not dismissed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      for (const [, checklist] of result.current.checklists) {
        expect(checklist.isDismissed).toBe(false)
      }
    })

    it('all checklists start as expanded', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      for (const [, checklist] of result.current.checklists) {
        expect(checklist.isExpanded).toBe(true)
      }
    })
  })

  describe('COMPLETE_TASK action', () => {
    it('marks specified task as completed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-1')?.completed).toBe(true)
    })

    it('unlocks dependent tasks', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Initially task-2 is locked
      let checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-2')?.locked).toBe(true)

      // Complete task-1
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      // Now task-2 should be unlocked
      checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-2')?.locked).toBe(false)
    })

    it('recalculates progress', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      let progress = result.current.getProgress('basic-checklist')
      expect(progress.completed).toBe(0)

      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      progress = result.current.getProgress('basic-checklist')
      expect(progress.completed).toBe(1)
    })

    it('calls onTaskComplete callback', () => {
      const { wrapper, callbacks } = createWrapperWithCallbacks([mockBasicChecklist])
      const { result } = renderHook(() => useChecklistContext(), { wrapper })

      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      expect(callbacks.onTaskComplete).toHaveBeenCalledWith('basic-checklist', 'task-1')
    })

    it('ignores invalid checklist ID', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Should not throw
      act(() => {
        result.current.completeTask('non-existent', 'task-1')
      })

      // State should be unchanged
      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.every((t) => !t.completed)).toBe(true)
    })
  })

  describe('UNCOMPLETE_TASK action', () => {
    it('marks task as not completed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // First complete the task
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      // Then uncomplete it
      act(() => {
        result.current.uncompleteTask('basic-checklist', 'task-1')
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-1')?.completed).toBe(false)
    })

    it('locks dependent tasks', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Complete task-1 to unlock task-2
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      let checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-2')?.locked).toBe(false)

      // Uncomplete task-1
      act(() => {
        result.current.uncompleteTask('basic-checklist', 'task-1')
      })

      // task-2 should be locked again
      checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-2')?.locked).toBe(true)
    })

    it('calls onTaskUncomplete callback', () => {
      const { wrapper, callbacks } = createWrapperWithCallbacks([mockBasicChecklist])
      const { result } = renderHook(() => useChecklistContext(), { wrapper })

      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      act(() => {
        result.current.uncompleteTask('basic-checklist', 'task-1')
      })

      expect(callbacks.onTaskUncomplete).toHaveBeenCalledWith('basic-checklist', 'task-1')
    })
  })

  describe('DISMISS_CHECKLIST action', () => {
    it('marks checklist as dismissed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockDismissibleChecklist] }),
      })

      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      const checklist = result.current.getChecklist('dismissible-checklist')
      expect(checklist?.isDismissed).toBe(true)
    })

    it('calls onChecklistDismiss callback', () => {
      const { wrapper, callbacks } = createWrapperWithCallbacks([mockDismissibleChecklist])
      const { result } = renderHook(() => useChecklistContext(), { wrapper })

      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      expect(callbacks.onChecklistDismiss).toHaveBeenCalledWith('dismissible-checklist')
    })

    it('calls checklist.config.onDismiss callback', () => {
      const onDismiss = vi.fn()
      const checklistWithCallback: ChecklistConfig = {
        ...mockDismissibleChecklist,
        onDismiss,
      }

      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [checklistWithCallback] }),
      })

      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      expect(onDismiss).toHaveBeenCalled()
    })
  })

  describe('RESTORE_CHECKLIST action', () => {
    it('marks checklist as not dismissed', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockDismissibleChecklist] }),
      })

      // First dismiss
      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      // Then restore
      act(() => {
        result.current.restoreChecklist('dismissible-checklist')
      })

      const checklist = result.current.getChecklist('dismissible-checklist')
      expect(checklist?.isDismissed).toBe(false)
    })
  })

  describe('SET_EXPANDED action', () => {
    it('sets expanded to true', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // First collapse
      act(() => {
        result.current.setExpanded('basic-checklist', false)
      })

      // Then expand
      act(() => {
        result.current.setExpanded('basic-checklist', true)
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.isExpanded).toBe(true)
    })

    it('sets expanded to false', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      act(() => {
        result.current.setExpanded('basic-checklist', false)
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.isExpanded).toBe(false)
    })
  })

  describe('toggleExpanded', () => {
    it('toggles expanded state', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Initially expanded
      expect(result.current.getChecklist('basic-checklist')?.isExpanded).toBe(true)

      act(() => {
        result.current.toggleExpanded('basic-checklist')
      })

      expect(result.current.getChecklist('basic-checklist')?.isExpanded).toBe(false)

      act(() => {
        result.current.toggleExpanded('basic-checklist')
      })

      expect(result.current.getChecklist('basic-checklist')?.isExpanded).toBe(true)
    })
  })

  describe('RESET_CHECKLIST action', () => {
    it('clears completed tasks for checklist', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Complete some tasks
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
      })

      // Reset
      act(() => {
        result.current.resetChecklist('basic-checklist')
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.tasks.every((t) => !t.completed)).toBe(true)
    })

    it('restores dismissed checklist', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockDismissibleChecklist] }),
      })

      // Dismiss
      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      // Reset
      act(() => {
        result.current.resetChecklist('dismissible-checklist')
      })

      const checklist = result.current.getChecklist('dismissible-checklist')
      expect(checklist?.isDismissed).toBe(false)
    })

    it('resets to expanded state', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      // Collapse
      act(() => {
        result.current.setExpanded('basic-checklist', false)
      })

      // Reset
      act(() => {
        result.current.resetChecklist('basic-checklist')
      })

      const checklist = result.current.getChecklist('basic-checklist')
      expect(checklist?.isExpanded).toBe(true)
    })

    it('does not affect other checklists', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      // Complete tasks in both checklists
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
        result.current.completeTask('no-deps-checklist', 'task-a')
      })

      // Reset only one
      act(() => {
        result.current.resetChecklist('basic-checklist')
      })

      // basic-checklist should be reset
      const basic = result.current.getChecklist('basic-checklist')
      expect(basic?.tasks.find((t) => t.config.id === 'task-1')?.completed).toBe(false)

      // no-deps-checklist should still have completed task
      const noDeps = result.current.getChecklist('no-deps-checklist')
      expect(noDeps?.tasks.find((t) => t.config.id === 'task-a')?.completed).toBe(true)
    })
  })

  describe('RESET_ALL action', () => {
    it('clears all completed tasks', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      // Complete tasks
      act(() => {
        result.current.completeTask('basic-checklist', 'task-1')
        result.current.completeTask('no-deps-checklist', 'task-a')
      })

      // Reset all
      act(() => {
        result.current.resetAll()
      })

      for (const [, checklist] of result.current.checklists) {
        expect(checklist.tasks.every((t) => !t.completed)).toBe(true)
      }
    })

    it('clears all dismissed states', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockDismissibleChecklist, mockNoDepsChecklist] }),
      })

      // Dismiss
      act(() => {
        result.current.dismissChecklist('dismissible-checklist')
      })

      // Reset all
      act(() => {
        result.current.resetAll()
      })

      for (const [, checklist] of result.current.checklists) {
        expect(checklist.isDismissed).toBe(false)
      }
    })

    it('resets all to expanded', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist, mockNoDepsChecklist] }),
      })

      // Collapse all
      act(() => {
        result.current.setExpanded('basic-checklist', false)
        result.current.setExpanded('no-deps-checklist', false)
      })

      // Reset all
      act(() => {
        result.current.resetAll()
      })

      for (const [, checklist] of result.current.checklists) {
        expect(checklist.isExpanded).toBe(true)
      }
    })
  })

  describe('checklist completion detection', () => {
    it('calls onChecklistComplete when all tasks done', async () => {
      const { wrapper, callbacks } = createWrapperWithCallbacks([mockNoDepsChecklist])
      const { result } = renderHook(() => useChecklistContext(), { wrapper })

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-a')
        result.current.completeTask('no-deps-checklist', 'task-b')
        result.current.completeTask('no-deps-checklist', 'task-c')
      })

      await waitFor(() => {
        expect(callbacks.onChecklistComplete).toHaveBeenCalledWith('no-deps-checklist')
      })
    })

    it('calls checklist.config.onComplete callback', async () => {
      const onComplete = vi.fn()
      const checklistWithCallback: ChecklistConfig = {
        ...mockNoDepsChecklist,
        onComplete,
      }

      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [checklistWithCallback] }),
      })

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-a')
        result.current.completeTask('no-deps-checklist', 'task-b')
        result.current.completeTask('no-deps-checklist', 'task-c')
      })

      await waitFor(() => {
        expect(onComplete).toHaveBeenCalled()
      })
    })

    it('does NOT re-fire onChecklistComplete after LOAD_PERSISTED of an already-notified complete checklist', async () => {
      const onChecklistComplete = vi.fn()
      const onComplete = vi.fn()
      const checklistWithCallback: ChecklistConfig = {
        ...mockNoDepsChecklist,
        onComplete,
      }
      const persistence = {
        enabled: true as const,
        onLoad: () => ({
          completed: { 'no-deps-checklist': ['task-a', 'task-b', 'task-c'] },
          dismissed: [],
          timestamp: 0,
          notifiedComplete: ['no-deps-checklist'],
        }),
        onSave: () => undefined,
      }

      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({
          checklists: [checklistWithCallback],
          persistence,
          onChecklistComplete,
        }),
      })

      // Wait until LOAD_PERSISTED has reconstituted the complete state.
      await waitFor(() => {
        const checklist = result.current.getChecklist('no-deps-checklist')
        expect(checklist?.isComplete).toBe(true)
      })

      // The completion-check effect must not fire callbacks for a checklist
      // whose completion was already notified in a prior session.
      expect(onChecklistComplete).not.toHaveBeenCalled()
      expect(onComplete).not.toHaveBeenCalled()
    })
  })

  describe('completedAt timestamps', () => {
    it('preserves completedAt for task A when an unrelated task B completes', async () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-a')
      })

      const firstStampA = result.current
        .getChecklist('no-deps-checklist')
        ?.tasks.find((t) => t.config.id === 'task-a')?.completedAt
      expect(firstStampA).toBeTypeOf('number')

      // Wait a tick so Date.now() for task-b would differ if recomputed.
      await new Promise((r) => setTimeout(r, 5))

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-b')
      })

      const secondStampA = result.current
        .getChecklist('no-deps-checklist')
        ?.tasks.find((t) => t.config.id === 'task-a')?.completedAt

      expect(secondStampA).toBe(firstStampA)
    })

    it('clears completedAt when a task is uncompleted', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-a')
      })

      expect(
        result.current
          .getChecklist('no-deps-checklist')
          ?.tasks.find((t) => t.config.id === 'task-a')?.completedAt
      ).toBeTypeOf('number')

      act(() => {
        result.current.uncompleteTask('no-deps-checklist', 'task-a')
      })

      expect(
        result.current
          .getChecklist('no-deps-checklist')
          ?.tasks.find((t) => t.config.id === 'task-a')?.completedAt
      ).toBeUndefined()
    })
  })

  describe('task action execution', () => {
    let cleanupLocation: () => void
    let openSpy: ReturnType<typeof mockWindowOpen>

    beforeEach(() => {
      cleanupLocation = mockWindowLocation()
      openSpy = mockWindowOpen()
    })

    afterEach(() => {
      cleanupLocation()
      openSpy.mockRestore()
    })

    it('executes navigate action (internal)', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockActionsChecklist] }),
      })

      act(() => {
        result.current.executeAction('actions-checklist', 'navigate-internal')
      })

      expect(window.location.href).toBe('/dashboard')
    })

    it('executes navigate action (external - window.open)', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockActionsChecklist] }),
      })

      act(() => {
        result.current.executeAction('actions-checklist', 'navigate-external')
      })

      expect(openSpy).toHaveBeenCalledWith('https://docs.example.com', '_blank')
    })

    it('executes callback action', () => {
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

      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [checklistWithCallback] }),
      })

      act(() => {
        result.current.executeAction('callback-checklist', 'callback-task')
      })

      expect(handler).toHaveBeenCalled()
    })

    it('calls onTaskAction callback', () => {
      const { wrapper, callbacks } = createWrapperWithCallbacks([mockActionsChecklist])
      const { result } = renderHook(() => useChecklistContext(), { wrapper })

      act(() => {
        result.current.executeAction('actions-checklist', 'navigate-internal')
      })

      expect(callbacks.onTaskAction).toHaveBeenCalledWith(
        'actions-checklist',
        'navigate-internal',
        expect.objectContaining({ type: 'navigate', url: '/dashboard' })
      )
    })

    it('auto-completes task when manualComplete is true (default)', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockActionsChecklist] }),
      })

      act(() => {
        result.current.executeAction('actions-checklist', 'navigate-internal')
      })

      const checklist = result.current.getChecklist('actions-checklist')
      expect(checklist?.tasks.find((t) => t.config.id === 'navigate-internal')?.completed).toBe(
        true
      )
    })

    it('does not auto-complete when manualComplete is false', () => {
      const checklistNoAutoComplete: ChecklistConfig = {
        id: 'no-auto-complete',
        title: 'No Auto Complete',
        tasks: [
          {
            id: 'task-1',
            title: 'Task 1',
            action: { type: 'navigate', url: '/page' },
            manualComplete: false,
          },
        ],
      }

      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [checklistNoAutoComplete] }),
      })

      act(() => {
        result.current.executeAction('no-auto-complete', 'task-1')
      })

      const checklist = result.current.getChecklist('no-auto-complete')
      expect(checklist?.tasks.find((t) => t.config.id === 'task-1')?.completed).toBe(false)
    })
  })

  describe('context data', () => {
    it('passes user data to task conditions', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({
          checklists: [mockConditionalChecklist],
          context: { user: { role: 'admin' } },
        }),
      })

      const checklist = result.current.getChecklist('conditional-checklist')
      const userTask = checklist?.tasks.find((t) => t.config.id === 'user-based')

      expect(userTask?.visible).toBe(true)
    })

    it('passes custom data to task conditions', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({
          checklists: [mockConditionalChecklist],
          context: { data: { showConditional: true } },
        }),
      })

      const checklist = result.current.getChecklist('conditional-checklist')
      const conditionalTask = checklist?.tasks.find((t) => t.config.id === 'conditional-task')

      expect(conditionalTask?.visible).toBe(true)
    })

    it('hides tasks when condition is not met', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({
          checklists: [mockConditionalChecklist],
          context: { data: { showConditional: false } },
        }),
      })

      const checklist = result.current.getChecklist('conditional-checklist')
      const conditionalTask = checklist?.tasks.find((t) => t.config.id === 'conditional-task')

      expect(conditionalTask?.visible).toBe(false)
    })
  })

  describe('getProgress', () => {
    it('returns correct progress for checklist', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockNoDepsChecklist] }),
      })

      let progress = result.current.getProgress('no-deps-checklist')
      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(3)
      expect(progress.percentage).toBe(0)

      act(() => {
        result.current.completeTask('no-deps-checklist', 'task-a')
      })

      progress = result.current.getProgress('no-deps-checklist')
      expect(progress.completed).toBe(1)
      expect(progress.total).toBe(3)
      expect(progress.percentage).toBeCloseTo(33.33, 1)
    })

    it('returns zero progress for invalid checklist ID', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const progress = result.current.getProgress('non-existent')

      expect(progress.completed).toBe(0)
      expect(progress.total).toBe(0)
      expect(progress.percentage).toBe(0)
      expect(progress.remaining).toBe(0)
    })
  })

  describe('getChecklist', () => {
    it('returns checklist for valid ID', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const checklist = result.current.getChecklist('basic-checklist')

      expect(checklist).toBeDefined()
      expect(checklist?.config.id).toBe('basic-checklist')
    })

    it('returns undefined for invalid ID', () => {
      const { result } = renderHook(() => useChecklistContext(), {
        wrapper: createWrapper({ checklists: [mockBasicChecklist] }),
      })

      const checklist = result.current.getChecklist('non-existent')

      expect(checklist).toBeUndefined()
    })
  })
})
