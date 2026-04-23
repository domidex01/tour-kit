import { describe, expect, it } from 'vitest'
import type { ChecklistTaskConfig } from '../../types'
import {
  canCompleteTask,
  hasCircularDependency,
  resolveTaskDependencies,
} from '../../utils/dependencies'

describe('dependencies', () => {
  describe('canCompleteTask', () => {
    const allTasks: ChecklistTaskConfig[] = [
      { id: 'task-1', title: 'Task 1' },
      { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] },
      { id: 'task-3', title: 'Task 3', dependsOn: ['task-1', 'task-2'] },
    ]

    it('returns true for task with no dependencies', () => {
      const task: ChecklistTaskConfig = { id: 'task-1', title: 'Task 1' }
      const completedTasks = new Set<string>()

      expect(canCompleteTask(task, completedTasks, allTasks)).toBe(true)
    })

    it('returns true for task with undefined dependsOn', () => {
      const task: ChecklistTaskConfig = { id: 'task-1', title: 'Task 1' }
      const completedTasks = new Set<string>()

      expect(canCompleteTask(task, completedTasks, allTasks)).toBe(true)
    })

    it('returns true for empty dependsOn array', () => {
      const task: ChecklistTaskConfig = { id: 'task-1', title: 'Task 1', dependsOn: [] }
      const completedTasks = new Set<string>()

      expect(canCompleteTask(task, completedTasks, allTasks)).toBe(true)
    })

    it('returns true when all dependencies are completed', () => {
      const task: ChecklistTaskConfig = { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] }
      const completedTasks = new Set(['task-1'])

      expect(canCompleteTask(task, completedTasks, allTasks)).toBe(true)
    })

    it('returns false when any dependency is not completed', () => {
      const task: ChecklistTaskConfig = { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] }
      const completedTasks = new Set<string>()

      expect(canCompleteTask(task, completedTasks, allTasks)).toBe(false)
    })

    it('handles single dependency correctly', () => {
      const task: ChecklistTaskConfig = { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] }

      expect(canCompleteTask(task, new Set(), allTasks)).toBe(false)
      expect(canCompleteTask(task, new Set(['task-1']), allTasks)).toBe(true)
    })

    it('handles multiple dependencies correctly', () => {
      const task: ChecklistTaskConfig = {
        id: 'task-3',
        title: 'Task 3',
        dependsOn: ['task-1', 'task-2'],
      }

      // No deps completed
      expect(canCompleteTask(task, new Set(), allTasks)).toBe(false)

      // Only one dep completed
      expect(canCompleteTask(task, new Set(['task-1']), allTasks)).toBe(false)
      expect(canCompleteTask(task, new Set(['task-2']), allTasks)).toBe(false)

      // All deps completed
      expect(canCompleteTask(task, new Set(['task-1', 'task-2']), allTasks)).toBe(true)
    })
  })

  describe('resolveTaskDependencies', () => {
    it('returns tasks in original order when no dependencies', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
        { id: 'task-3', title: 'Task 3' },
      ]

      const result = resolveTaskDependencies(tasks)

      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2', 'task-3'])
    })

    it('orders dependent tasks after their dependencies', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] },
        { id: 'task-1', title: 'Task 1' },
      ]

      const result = resolveTaskDependencies(tasks)

      expect(result.map((t) => t.id)).toEqual(['task-1', 'task-2'])
    })

    it('handles linear dependency chain (A -> B -> C)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-c', title: 'Task C', dependsOn: ['task-b'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-a', title: 'Task A' },
      ]

      const result = resolveTaskDependencies(tasks)

      // task-a first, then task-b, then task-c
      const aIndex = result.findIndex((t) => t.id === 'task-a')
      const bIndex = result.findIndex((t) => t.id === 'task-b')
      const cIndex = result.findIndex((t) => t.id === 'task-c')

      expect(aIndex).toBeLessThan(bIndex)
      expect(bIndex).toBeLessThan(cIndex)
    })

    it('handles diamond dependency pattern (A -> B,C -> D)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-d', title: 'Task D', dependsOn: ['task-b', 'task-c'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-a'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-a', title: 'Task A' },
      ]

      const result = resolveTaskDependencies(tasks)

      const aIndex = result.findIndex((t) => t.id === 'task-a')
      const bIndex = result.findIndex((t) => t.id === 'task-b')
      const cIndex = result.findIndex((t) => t.id === 'task-c')
      const dIndex = result.findIndex((t) => t.id === 'task-d')

      expect(aIndex).toBeLessThan(bIndex)
      expect(aIndex).toBeLessThan(cIndex)
      expect(bIndex).toBeLessThan(dIndex)
      expect(cIndex).toBeLessThan(dIndex)
    })

    it('handles tasks with multiple dependencies', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-3', title: 'Task 3', dependsOn: ['task-1', 'task-2'] },
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
      ]

      const result = resolveTaskDependencies(tasks)

      const idx1 = result.findIndex((t) => t.id === 'task-1')
      const idx2 = result.findIndex((t) => t.id === 'task-2')
      const idx3 = result.findIndex((t) => t.id === 'task-3')

      expect(idx1).toBeLessThan(idx3)
      expect(idx2).toBeLessThan(idx3)
    })

    it('does not duplicate tasks in output', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-3', title: 'Task 3', dependsOn: ['task-1', 'task-2'] },
        { id: 'task-2', title: 'Task 2', dependsOn: ['task-1'] },
        { id: 'task-1', title: 'Task 1' },
      ]

      const result = resolveTaskDependencies(tasks)

      expect(result.length).toBe(3)
      expect(new Set(result.map((t) => t.id)).size).toBe(3)
    })

    it('ignores references to non-existent task IDs', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-1', title: 'Task 1', dependsOn: ['non-existent'] },
        { id: 'task-2', title: 'Task 2' },
      ]

      const result = resolveTaskDependencies(tasks)

      expect(result.length).toBe(2)
      expect(result.map((t) => t.id)).toContain('task-1')
      expect(result.map((t) => t.id)).toContain('task-2')
    })

    it('handles empty task array', () => {
      const result = resolveTaskDependencies([])

      expect(result).toEqual([])
    })

    it('throws on direct self-reference (A -> A)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-a'] },
      ]

      expect(() => resolveTaskDependencies(tasks)).toThrow(/Circular dependency/)
    })

    it('throws on two-step cycle (A -> B -> A)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-b'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
      ]

      expect(() => resolveTaskDependencies(tasks)).toThrow(/Circular dependency/)
    })

    it('throws on multi-step cycle and names the path', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-b'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-c'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-a'] },
      ]

      expect(() => resolveTaskDependencies(tasks)).toThrow(/task-a.*task-b.*task-c.*task-a/)
    })
  })

  describe('hasCircularDependency', () => {
    it('returns false for tasks with no dependencies', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-1', title: 'Task 1' },
        { id: 'task-2', title: 'Task 2' },
        { id: 'task-3', title: 'Task 3' },
      ]

      expect(hasCircularDependency(tasks)).toBe(false)
    })

    it('returns false for valid linear dependency chain', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A' },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-b'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(false)
    })

    it('returns true for direct self-reference (A -> A)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-a'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(true)
    })

    it('returns true for two-step cycle (A -> B -> A)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-b'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(true)
    })

    it('returns true for three-step cycle (A -> B -> C -> A)', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A', dependsOn: ['task-c'] },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-b'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(true)
    })

    it('handles complex graph without cycles', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A' },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-a'] },
        { id: 'task-d', title: 'Task D', dependsOn: ['task-b', 'task-c'] },
        { id: 'task-e', title: 'Task E', dependsOn: ['task-d'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(false)
    })

    it('handles empty task array', () => {
      expect(hasCircularDependency([])).toBe(false)
    })

    it('returns false for valid diamond pattern', () => {
      const tasks: ChecklistTaskConfig[] = [
        { id: 'task-a', title: 'Task A' },
        { id: 'task-b', title: 'Task B', dependsOn: ['task-a'] },
        { id: 'task-c', title: 'Task C', dependsOn: ['task-a'] },
        { id: 'task-d', title: 'Task D', dependsOn: ['task-b', 'task-c'] },
      ]

      expect(hasCircularDependency(tasks)).toBe(false)
    })
  })
})
