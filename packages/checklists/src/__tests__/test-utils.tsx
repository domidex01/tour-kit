/**
 * @tour-kit/checklists - Test Utilities
 *
 * Provides reusable test fixtures, wrapper factories, and mock helpers.
 */
import type { ReactNode } from 'react'
import { expect, vi } from 'vitest'
import { ChecklistProvider } from '../context/checklist-provider'
import type {
  ChecklistConfig,
  ChecklistProgress,
  ChecklistProviderConfig,
  ChecklistState,
  ChecklistTaskConfig,
  ChecklistTaskState,
} from '../types'

// ============================================================================
// Mock Checklist Fixtures
// ============================================================================

/**
 * Simple task without dependencies
 */
export const mockSimpleTask: ChecklistTaskConfig = {
  id: 'simple-task',
  title: 'Simple Task',
  description: 'A basic task without dependencies',
}

/**
 * Task with navigate action (internal)
 */
export const mockNavigateTask: ChecklistTaskConfig = {
  id: 'navigate-task',
  title: 'Navigate Task',
  action: { type: 'navigate', url: '/dashboard' },
}

/**
 * Task with navigate action (external)
 */
export const mockExternalNavigateTask: ChecklistTaskConfig = {
  id: 'external-task',
  title: 'External Link',
  action: { type: 'navigate', url: 'https://example.com', external: true },
}

/**
 * Task with callback action
 */
export function createMockCallbackTask(): ChecklistTaskConfig {
  return {
    id: 'callback-task',
    title: 'Callback Task',
    action: { type: 'callback', handler: vi.fn() },
  }
}

/**
 * Basic checklist with 3 sequential tasks
 */
export const mockBasicChecklist: ChecklistConfig = {
  id: 'basic-checklist',
  title: 'Basic Checklist',
  description: 'A simple checklist for testing',
  tasks: [
    { id: 'task-1', title: 'First Task' },
    { id: 'task-2', title: 'Second Task', dependsOn: ['task-1'] },
    { id: 'task-3', title: 'Third Task', dependsOn: ['task-2'] },
  ],
}

/**
 * Checklist without dependencies
 */
export const mockNoDepsChecklist: ChecklistConfig = {
  id: 'no-deps-checklist',
  title: 'No Dependencies Checklist',
  tasks: [
    { id: 'task-a', title: 'Task A' },
    { id: 'task-b', title: 'Task B' },
    { id: 'task-c', title: 'Task C' },
  ],
}

/**
 * Checklist with dismissible option
 */
export const mockDismissibleChecklist: ChecklistConfig = {
  ...mockBasicChecklist,
  id: 'dismissible-checklist',
  dismissible: true,
}

/**
 * Checklist that hides on complete
 */
export const mockHideOnCompleteChecklist: ChecklistConfig = {
  ...mockBasicChecklist,
  id: 'hide-on-complete',
  hideOnComplete: true,
}

/**
 * Checklist with conditional task visibility
 */
export const mockConditionalChecklist: ChecklistConfig = {
  id: 'conditional-checklist',
  title: 'Conditional Checklist',
  tasks: [
    { id: 'always-visible', title: 'Always Visible' },
    {
      id: 'conditional-task',
      title: 'Conditional Task',
      when: (ctx) => ctx.data.showConditional === true,
    },
    {
      id: 'user-based',
      title: 'User Based',
      when: (ctx) => ctx.user.role === 'admin',
    },
  ],
}

/**
 * Checklist with various action types
 */
export const mockActionsChecklist: ChecklistConfig = {
  id: 'actions-checklist',
  title: 'Actions Checklist',
  tasks: [
    {
      id: 'navigate-internal',
      title: 'Go to Dashboard',
      action: { type: 'navigate', url: '/dashboard' },
    },
    {
      id: 'navigate-external',
      title: 'Visit Docs',
      action: { type: 'navigate', url: 'https://docs.example.com', external: true },
    },
    {
      id: 'callback-action',
      title: 'Run Callback',
      action: { type: 'callback', handler: vi.fn() },
    },
    {
      id: 'tour-action',
      title: 'Start Tour',
      action: { type: 'tour', tourId: 'onboarding-tour' },
    },
    {
      id: 'modal-action',
      title: 'Open Modal',
      action: { type: 'modal', modalId: 'settings-modal' },
    },
    {
      id: 'custom-action',
      title: 'Custom Action',
      action: { type: 'custom', data: { customKey: 'customValue' } },
    },
  ],
}

/**
 * Checklist with circular dependencies (for error testing)
 */
export const mockCircularChecklist: ChecklistConfig = {
  id: 'circular-checklist',
  title: 'Circular Checklist',
  tasks: [
    { id: 'cycle-a', title: 'Cycle A', dependsOn: ['cycle-b'] },
    { id: 'cycle-b', title: 'Cycle B', dependsOn: ['cycle-a'] },
  ],
}

/**
 * Checklist with unknown dependency reference
 */
export const mockUnknownDepChecklist: ChecklistConfig = {
  id: 'unknown-dep-checklist',
  title: 'Unknown Dep Checklist',
  tasks: [{ id: 'task-1', title: 'Task 1', dependsOn: ['non-existent'] }],
}

// ============================================================================
// Task State Factory
// ============================================================================

/**
 * Creates a mock ChecklistTaskState for component testing
 */
export function createMockTaskState(
  overrides: Partial<ChecklistTaskState> & { config?: Partial<ChecklistTaskConfig> } = {}
): ChecklistTaskState {
  const { config: configOverrides, ...stateOverrides } = overrides
  return {
    config: {
      id: 'test-task',
      title: 'Test Task',
      description: 'Test task description',
      ...configOverrides,
    },
    completed: false,
    locked: false,
    visible: true,
    active: false,
    ...stateOverrides,
  }
}

/**
 * Creates a mock ChecklistState for component testing
 */
export function createMockChecklistState(overrides: Partial<ChecklistState> = {}): ChecklistState {
  const defaultTasks = [
    createMockTaskState({ config: { id: 'task-1', title: 'Task 1' } }),
    createMockTaskState({ config: { id: 'task-2', title: 'Task 2' } }),
  ]

  return {
    config: mockBasicChecklist,
    tasks: defaultTasks,
    progress: 0,
    completedCount: 0,
    totalCount: defaultTasks.length,
    isComplete: false,
    isDismissed: false,
    isExpanded: true,
    ...overrides,
  }
}

/**
 * Creates a mock ChecklistProgress object
 */
export function createMockProgress(overrides: Partial<ChecklistProgress> = {}): ChecklistProgress {
  return {
    completed: 0,
    total: 3,
    percentage: 0,
    remaining: 3,
    ...overrides,
  }
}

// ============================================================================
// Provider Wrapper Factory
// ============================================================================

export interface WrapperOptions extends Partial<Omit<ChecklistProviderConfig, 'checklists'>> {
  checklists?: ChecklistConfig[]
}

/**
 * Creates a wrapper component for testing hooks and components
 * that require ChecklistProvider
 */
export function createWrapper(options: WrapperOptions = {}) {
  const { checklists = [mockBasicChecklist], ...providerOptions } = options

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <ChecklistProvider checklists={checklists} {...providerOptions}>
        {children}
      </ChecklistProvider>
    )
  }
}

/**
 * Creates a wrapper with callback spies pre-configured
 */
export function createWrapperWithCallbacks(checklists: ChecklistConfig[] = [mockBasicChecklist]): {
  wrapper: ReturnType<typeof createWrapper>
  callbacks: {
    onTaskComplete: ReturnType<typeof vi.fn>
    onTaskUncomplete: ReturnType<typeof vi.fn>
    onChecklistComplete: ReturnType<typeof vi.fn>
    onChecklistDismiss: ReturnType<typeof vi.fn>
    onTaskAction: ReturnType<typeof vi.fn>
  }
} {
  const callbacks = {
    onTaskComplete: vi.fn(),
    onTaskUncomplete: vi.fn(),
    onChecklistComplete: vi.fn(),
    onChecklistDismiss: vi.fn(),
    onTaskAction: vi.fn(),
  }

  const wrapper = createWrapper({ checklists, ...callbacks })

  return { wrapper, callbacks }
}

// ============================================================================
// Browser API Mocks
// ============================================================================

/**
 * Mocks window.location for testing navigate actions
 * Returns a cleanup function
 */
export function mockWindowLocation() {
  const originalLocation = window.location
  const mockedLocation = {
    ...originalLocation,
    href: '',
    assign: vi.fn(),
    replace: vi.fn(),
  }

  // @ts-expect-error - Deleting location for mock
  window.location = undefined
  // @ts-expect-error - Setting mocked location
  window.location = mockedLocation as unknown as Location

  return function cleanup() {
    // @ts-expect-error - Restoring original location
    window.location = originalLocation
  }
}

/**
 * Mocks window.open for testing external navigate actions
 */
export function mockWindowOpen() {
  const openSpy = vi.spyOn(window, 'open').mockImplementation(() => null)
  return openSpy
}

/**
 * Creates a localStorage mock with quota error support
 */
export function createLocalStorageMock() {
  let store: Record<string, string> = {}
  let quotaExceeded = false

  const mock = {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => {
      if (quotaExceeded) {
        throw new DOMException('QuotaExceededError', 'QuotaExceededError')
      }
      store[key] = value
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      store = {}
    }),
    get length() {
      return Object.keys(store).length
    },
    key: vi.fn((index: number) => Object.keys(store)[index] ?? null),
    // Test helpers
    __setQuotaExceeded: (value: boolean) => {
      quotaExceeded = value
    },
    __getStore: () => ({ ...store }),
    __setStore: (newStore: Record<string, string>) => {
      store = { ...newStore }
    },
    __reset: () => {
      store = {}
      quotaExceeded = false
    },
  }

  return mock
}

/**
 * Installs localStorage mock globally
 * Returns cleanup function
 */
export function installLocalStorageMock() {
  const mock = createLocalStorageMock()
  const originalStorage = window.localStorage

  Object.defineProperty(window, 'localStorage', {
    value: mock,
    writable: true,
  })

  return {
    mock,
    cleanup: () => {
      Object.defineProperty(window, 'localStorage', {
        value: originalStorage,
        writable: true,
      })
    },
  }
}

// ============================================================================
// Console Spy Helpers
// ============================================================================

/**
 * Creates console spies for error/warn testing
 * Returns cleanup function
 */
export function createConsoleSpy() {
  const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})

  return {
    errorSpy,
    warnSpy,
    cleanup: () => {
      errorSpy.mockRestore()
      warnSpy.mockRestore()
    },
  }
}

// ============================================================================
// Assertion Helpers
// ============================================================================

/**
 * Asserts that a task is in a specific state
 */
export function expectTaskState(
  task: ChecklistTaskState | undefined,
  expected: {
    completed?: boolean
    locked?: boolean
    visible?: boolean
    active?: boolean
  }
) {
  expect(task).toBeDefined()
  if (!task) return

  if (expected.completed !== undefined) {
    expect(task.completed).toBe(expected.completed)
  }
  if (expected.locked !== undefined) {
    expect(task.locked).toBe(expected.locked)
  }
  if (expected.visible !== undefined) {
    expect(task.visible).toBe(expected.visible)
  }
  if (expected.active !== undefined) {
    expect(task.active).toBe(expected.active)
  }
}

/**
 * Asserts that progress values are correct
 */
export function expectProgress(
  progress: ChecklistProgress,
  expected: {
    completed?: number
    total?: number
    percentage?: number
    remaining?: number
  }
) {
  if (expected.completed !== undefined) {
    expect(progress.completed).toBe(expected.completed)
  }
  if (expected.total !== undefined) {
    expect(progress.total).toBe(expected.total)
  }
  if (expected.percentage !== undefined) {
    expect(progress.percentage).toBeCloseTo(expected.percentage, 1)
  }
  if (expected.remaining !== undefined) {
    expect(progress.remaining).toBe(expected.remaining)
  }
}

// ============================================================================
// Re-exports for Convenience
// ============================================================================

export { render, screen, within, waitFor } from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event'
export { act, renderHook } from '@testing-library/react'
export { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
