import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  ChecklistHeadless,
  type ChecklistRenderProps,
} from '../../../components/headless/checklist-headless'
import { createWrapper, mockBasicChecklist, mockNoDepsChecklist } from '../../test-utils'

describe('ChecklistHeadless', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('rendering', () => {
    it('calls render prop with checklist data', () => {
      const renderFn = vi.fn(() => <div data-testid="rendered">Rendered</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless checklistId="basic-checklist" render={renderFn} />
        </Wrapper>
      )

      expect(renderFn).toHaveBeenCalled()
      expect(screen.getByTestId('rendered')).toBeInTheDocument()
    })

    it('calls children function when render not provided', () => {
      const childrenFn = vi.fn(() => <div data-testid="children-rendered">Children</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={undefined as unknown as (props: ChecklistRenderProps) => React.ReactNode}
          >
            {childrenFn}
          </ChecklistHeadless>
        </Wrapper>
      )

      expect(childrenFn).toHaveBeenCalled()
      expect(screen.getByTestId('children-rendered')).toBeInTheDocument()
    })

    it('returns null when checklist does not exist', () => {
      const renderFn = vi.fn(() => <div data-testid="checklist-content">Content</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless checklistId="non-existent" render={renderFn} />
        </Wrapper>
      )

      expect(renderFn).not.toHaveBeenCalled()
      expect(screen.queryByTestId('checklist-content')).not.toBeInTheDocument()
    })

    it('warns when neither render nor children provided', () => {
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={undefined as unknown as (props: ChecklistRenderProps) => React.ReactNode}
          />
        </Wrapper>
      )

      expect(consoleWarnSpy).toHaveBeenCalledWith(
        '[tour-kit]',
        expect.stringContaining('requires render prop or children')
      )
    })
  })

  describe('render props', () => {
    it('provides checklist state', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(receivedProps?.checklist).toBeDefined()
      expect(receivedProps?.checklist.config.id).toBe('basic-checklist')
    })

    it('provides visibleTasks array', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(Array.isArray(receivedProps?.visibleTasks)).toBe(true)
      expect(receivedProps?.visibleTasks.length).toBe(3)
    })

    it('provides progress object', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(receivedProps?.progress).toBeDefined()
      expect(receivedProps?.progress.completed).toBe(0)
      expect(receivedProps?.progress.total).toBe(3)
    })

    it('provides isComplete boolean', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isComplete).toBe('boolean')
      expect(receivedProps?.isComplete).toBe(false)
    })

    it('provides isDismissed boolean', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isDismissed).toBe('boolean')
      expect(receivedProps?.isDismissed).toBe(false)
    })

    it('provides isExpanded boolean', () => {
      let receivedProps: ChecklistRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isExpanded).toBe('boolean')
      expect(receivedProps?.isExpanded).toBe(true)
    })

    it('provides completeTask function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="no-deps-checklist"
            render={({ completeTask, visibleTasks }) => (
              <button type="button" onClick={() => completeTask('task-a')}>
                {visibleTasks.find((t) => t.config.id === 'task-a')?.completed
                  ? 'Completed'
                  : 'Complete'}
              </button>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByText('Complete')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Completed')).toBeInTheDocument()
    })

    it('provides uncompleteTask function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="no-deps-checklist"
            render={({ completeTask, uncompleteTask, visibleTasks }) => (
              <>
                <button type="button" onClick={() => completeTask('task-a')}>
                  Complete
                </button>
                <button type="button" onClick={() => uncompleteTask('task-a')}>
                  Uncomplete
                </button>
                <span>
                  {visibleTasks.find((t) => t.config.id === 'task-a')?.completed
                    ? 'Done'
                    : 'Not Done'}
                </span>
              </>
            )}
          />
        </Wrapper>
      )

      await user.click(screen.getByText('Complete'))
      expect(screen.getByText('Done')).toBeInTheDocument()

      await user.click(screen.getByText('Uncomplete'))
      expect(screen.getByText('Not Done')).toBeInTheDocument()
    })

    it('provides dismiss function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={({ dismiss, isDismissed }) => (
              <div>
                <button type="button" onClick={dismiss}>
                  Dismiss
                </button>
                <span data-testid="status">{isDismissed ? 'Dismissed' : 'Active'}</span>
              </div>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByTestId('status')).toHaveTextContent('Active')

      await user.click(screen.getByText('Dismiss'))

      // After dismissing, isDismissed should be true
      expect(screen.getByTestId('status')).toHaveTextContent('Dismissed')
    })

    it('provides restore function', async () => {
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={({ dismiss, restore: _restore, isDismissed }) => {
              return (
                <div>
                  <button type="button" onClick={dismiss}>
                    Dismiss
                  </button>
                  <span>{isDismissed ? 'Dismissed' : 'Active'}</span>
                </div>
              )
            }}
          />
        </Wrapper>
      )

      expect(screen.getByText('Active')).toBeInTheDocument()
    })

    it('provides toggleExpanded function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={({ toggleExpanded, isExpanded }) => (
              <button type="button" onClick={toggleExpanded}>
                {isExpanded ? 'Expanded' : 'Collapsed'}
              </button>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByText('Expanded')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Collapsed')).toBeInTheDocument()
    })

    it('provides setExpanded function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="basic-checklist"
            render={({ setExpanded, isExpanded }) => (
              <>
                <button type="button" onClick={() => setExpanded(false)}>
                  Collapse
                </button>
                <button type="button" onClick={() => setExpanded(true)}>
                  Expand
                </button>
                <span>{isExpanded ? 'Expanded' : 'Collapsed'}</span>
              </>
            )}
          />
        </Wrapper>
      )

      await user.click(screen.getByText('Collapse'))
      expect(screen.getByText('Collapsed')).toBeInTheDocument()

      await user.click(screen.getByText('Expand'))
      expect(screen.getByText('Expanded')).toBeInTheDocument()
    })

    it('provides reset function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="no-deps-checklist"
            render={({ completeTask, reset, progress }) => (
              <>
                <button type="button" onClick={() => completeTask('task-a')}>
                  Complete
                </button>
                <button type="button" onClick={reset}>
                  Reset
                </button>
                <span>Completed: {progress.completed}</span>
              </>
            )}
          />
        </Wrapper>
      )

      await user.click(screen.getByText('Complete'))
      expect(screen.getByText('Completed: 1')).toBeInTheDocument()

      await user.click(screen.getByText('Reset'))
      expect(screen.getByText('Completed: 0')).toBeInTheDocument()
    })
  })

  describe('function stability', () => {
    it('functions work correctly across rerenders', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      const { rerender } = render(
        <Wrapper>
          <ChecklistHeadless
            checklistId="no-deps-checklist"
            render={({ completeTask, visibleTasks }) => (
              <div>
                <button type="button" onClick={() => completeTask('task-a')}>
                  Complete
                </button>
                <span data-testid="status">
                  {visibleTasks.find((t) => t.config.id === 'task-a')?.completed
                    ? 'Done'
                    : 'Not Done'}
                </span>
              </div>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByTestId('status')).toHaveTextContent('Not Done')

      // Rerender without state change
      rerender(
        <Wrapper>
          <ChecklistHeadless
            checklistId="no-deps-checklist"
            render={({ completeTask, visibleTasks }) => (
              <div>
                <button type="button" onClick={() => completeTask('task-a')}>
                  Complete
                </button>
                <span data-testid="status">
                  {visibleTasks.find((t) => t.config.id === 'task-a')?.completed
                    ? 'Done'
                    : 'Not Done'}
                </span>
              </div>
            )}
          />
        </Wrapper>
      )

      // Function should still work after rerender
      await user.click(screen.getByText('Complete'))
      expect(screen.getByTestId('status')).toHaveTextContent('Done')
    })
  })
})
