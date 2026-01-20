import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ChecklistConfig, ChecklistTaskConfig } from '../../types'
import { createChecklist, createTask } from '../../utils/create-checklist'

describe('create-checklist', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleErrorSpy.mockRestore()
  })

  describe('createChecklist', () => {
    it('returns the config object unchanged when valid', () => {
      const config: ChecklistConfig = {
        id: 'test-checklist',
        title: 'Test Checklist',
        tasks: [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] },
        ],
      }

      const result = createChecklist(config)

      expect(result).toBe(config)
      expect(result.id).toBe('test-checklist')
      expect(result.tasks.length).toBe(2)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('logs error for circular dependency', () => {
      const config: ChecklistConfig = {
        id: 'circular-checklist',
        title: 'Circular Checklist',
        tasks: [
          { id: 'task-a', title: 'Task A', dependsOn: ['task-b'] },
          { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        ],
      }

      const result = createChecklist(config)

      expect(result).toBe(config)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[tour-kit]',
        expect.stringContaining('Circular dependency detected')
      )
    })

    it('logs error for unknown dependency reference', () => {
      const config: ChecklistConfig = {
        id: 'unknown-dep-checklist',
        title: 'Unknown Dep Checklist',
        tasks: [{ id: 'task-1', title: 'Task 1', dependsOn: ['non-existent'] }],
      }

      const result = createChecklist(config)

      expect(result).toBe(config)
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[tour-kit]',
        expect.stringContaining('depends on unknown task')
      )
    })

    it('validates all tasks for unknown dependencies', () => {
      const config: ChecklistConfig = {
        id: 'multiple-unknown-deps',
        title: 'Multiple Unknown Deps',
        tasks: [
          { id: 'task-1', title: 'Task 1', dependsOn: ['unknown-1'] },
          { id: 'task-2', title: 'Task 2', dependsOn: ['unknown-2', 'unknown-3'] },
        ],
      }

      createChecklist(config)

      // Should log error for each unknown dependency
      expect(consoleErrorSpy).toHaveBeenCalledWith('[tour-kit]', expect.stringContaining('unknown-1'))
      expect(consoleErrorSpy).toHaveBeenCalledWith('[tour-kit]', expect.stringContaining('unknown-2'))
      expect(consoleErrorSpy).toHaveBeenCalledWith('[tour-kit]', expect.stringContaining('unknown-3'))
    })

    it('does not throw for invalid config (logs only)', () => {
      const config: ChecklistConfig = {
        id: 'invalid-checklist',
        title: 'Invalid Checklist',
        tasks: [
          { id: 'task-a', title: 'Task A', dependsOn: ['task-b'] },
          { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        ],
      }

      expect(() => createChecklist(config)).not.toThrow()
    })

    it('handles checklist with no dependencies', () => {
      const config: ChecklistConfig = {
        id: 'no-deps-checklist',
        title: 'No Deps Checklist',
        tasks: [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2' },
        ],
      }

      const result = createChecklist(config)

      expect(result).toBe(config)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('handles checklist with valid chain dependencies', () => {
      const config: ChecklistConfig = {
        id: 'chain-checklist',
        title: 'Chain Checklist',
        tasks: [
          { id: 'task-1', title: 'Task 1' },
          { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] },
          { id: 'task-3', title: 'Task 3', dependsOn: ['task-2'] },
        ],
      }

      const result = createChecklist(config)

      expect(result).toBe(config)
      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('preserves all config properties', () => {
      const config: ChecklistConfig = {
        id: 'full-config',
        title: 'Full Config Checklist',
        description: 'A complete checklist config',
        dismissible: true,
        hideOnComplete: true,
        meta: { key: 'value' },
        tasks: [{ id: 'task-1', title: 'Task 1' }],
        onComplete: vi.fn(),
        onDismiss: vi.fn(),
      }

      const result = createChecklist(config)

      expect(result.id).toBe('full-config')
      expect(result.title).toBe('Full Config Checklist')
      expect(result.description).toBe('A complete checklist config')
      expect(result.dismissible).toBe(true)
      expect(result.hideOnComplete).toBe(true)
      expect(result.meta).toEqual({ key: 'value' })
      expect(result.onComplete).toBe(config.onComplete)
      expect(result.onDismiss).toBe(config.onDismiss)
    })
  })

  describe('createTask', () => {
    it('returns the task config unchanged', () => {
      const taskConfig: ChecklistTaskConfig = {
        id: 'test-task',
        title: 'Test Task',
      }

      const result = createTask(taskConfig)

      expect(result).toBe(taskConfig)
    })

    it('accepts minimal task config (id + title)', () => {
      const taskConfig: ChecklistTaskConfig = {
        id: 'minimal-task',
        title: 'Minimal Task',
      }

      const result = createTask(taskConfig)

      expect(result.id).toBe('minimal-task')
      expect(result.title).toBe('Minimal Task')
    })

    it('preserves all optional properties', () => {
      const handler = vi.fn()
      const whenFn = vi.fn().mockReturnValue(true)

      const taskConfig: ChecklistTaskConfig = {
        id: 'full-task',
        title: 'Full Task',
        description: 'A complete task config',
        icon: 'check',
        dependsOn: ['other-task'],
        when: whenFn,
        manualComplete: false,
        meta: { customKey: 'customValue' },
        action: {
          type: 'callback',
          handler,
        },
      }

      const result = createTask(taskConfig)

      expect(result.id).toBe('full-task')
      expect(result.title).toBe('Full Task')
      expect(result.description).toBe('A complete task config')
      expect(result.icon).toBe('check')
      expect(result.dependsOn).toEqual(['other-task'])
      expect(result.when).toBe(whenFn)
      expect(result.manualComplete).toBe(false)
      expect(result.meta).toEqual({ customKey: 'customValue' })
      expect(result.action).toEqual({ type: 'callback', handler })
    })

    it('preserves navigate action config', () => {
      const taskConfig: ChecklistTaskConfig = {
        id: 'nav-task',
        title: 'Navigate Task',
        action: {
          type: 'navigate',
          url: '/dashboard',
          external: true,
        },
      }

      const result = createTask(taskConfig)

      expect(result.action).toEqual({
        type: 'navigate',
        url: '/dashboard',
        external: true,
      })
    })

    it('preserves tour action config', () => {
      const taskConfig: ChecklistTaskConfig = {
        id: 'tour-task',
        title: 'Tour Task',
        action: {
          type: 'tour',
          tourId: 'onboarding-tour',
        },
      }

      const result = createTask(taskConfig)

      expect(result.action).toEqual({
        type: 'tour',
        tourId: 'onboarding-tour',
      })
    })

    it('preserves custom action config', () => {
      const taskConfig: ChecklistTaskConfig = {
        id: 'custom-task',
        title: 'Custom Task',
        action: {
          type: 'custom',
          data: { foo: 'bar', nested: { value: 123 } },
        },
      }

      const result = createTask(taskConfig)

      expect(result.action).toEqual({
        type: 'custom',
        data: { foo: 'bar', nested: { value: 123 } },
      })
    })
  })
})
