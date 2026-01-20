import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { TaskHeadless, type TaskRenderProps } from '../../../components/headless/task-headless'
import {
  createWrapper,
  mockBasicChecklist,
  mockConditionalChecklist,
  mockNoDepsChecklist,
} from '../../test-utils'

describe('TaskHeadless', () => {
  let consoleWarnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    consoleWarnSpy.mockRestore()
  })

  describe('rendering', () => {
    it('calls render prop with task data', () => {
      const renderFn = vi.fn(() => <div data-testid="rendered">Rendered</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless checklistId="basic-checklist" taskId="task-1" render={renderFn} />
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
          <TaskHeadless
            checklistId="basic-checklist"
            taskId="task-1"
            render={undefined as unknown as (props: TaskRenderProps) => React.ReactNode}
          >
            {childrenFn}
          </TaskHeadless>
        </Wrapper>
      )

      expect(childrenFn).toHaveBeenCalled()
      expect(screen.getByTestId('children-rendered')).toBeInTheDocument()
    })

    it('returns null when task does not exist', () => {
      const renderFn = vi.fn(() => <div>Content</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless checklistId="basic-checklist" taskId="non-existent" render={renderFn} />
        </Wrapper>
      )

      expect(renderFn).not.toHaveBeenCalled()
    })

    it('returns null when task is not visible', () => {
      const renderFn = vi.fn(() => <div>Content</div>)
      // Create wrapper with conditional checklist where task is hidden
      const Wrapper = createWrapper({
        checklists: [mockConditionalChecklist],
        context: { data: { showConditional: false } },
      })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="conditional-checklist"
            taskId="conditional-task"
            render={renderFn}
          />
        </Wrapper>
      )

      expect(renderFn).not.toHaveBeenCalled()
    })

    it('warns when neither render nor children provided', () => {
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="basic-checklist"
            taskId="task-1"
            render={undefined as unknown as (props: TaskRenderProps) => React.ReactNode}
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
    it('provides task state', () => {
      let receivedProps: TaskRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="basic-checklist"
            taskId="task-1"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(receivedProps?.task).toBeDefined()
      expect(receivedProps?.task.config.id).toBe('task-1')
    })

    it('provides isCompleted boolean', () => {
      let receivedProps: TaskRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="no-deps-checklist"
            taskId="task-a"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isCompleted).toBe('boolean')
      expect(receivedProps?.isCompleted).toBe(false)
    })

    it('provides isLocked boolean', () => {
      let receivedProps: TaskRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="basic-checklist"
            taskId="task-2"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isLocked).toBe('boolean')
      // task-2 depends on task-1, so should be locked
      expect(receivedProps?.isLocked).toBe(true)
    })

    it('provides isVisible boolean', () => {
      let receivedProps: TaskRenderProps | undefined
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="basic-checklist"
            taskId="task-1"
            render={(props) => {
              receivedProps = props
              return null
            }}
          />
        </Wrapper>
      )

      expect(receivedProps).toBeDefined()
      expect(typeof receivedProps?.isVisible).toBe('boolean')
      expect(receivedProps?.isVisible).toBe(true)
    })

    it('provides complete function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="no-deps-checklist"
            taskId="task-a"
            render={({ complete, isCompleted }) => (
              <button type="button" onClick={complete}>
                {isCompleted ? 'Done' : 'Complete'}
              </button>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByText('Complete')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))

      expect(screen.getByText('Done')).toBeInTheDocument()
    })

    it('provides uncomplete function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="no-deps-checklist"
            taskId="task-a"
            render={({ complete, uncomplete, isCompleted }) => (
              <>
                <button type="button" onClick={complete}>
                  Complete
                </button>
                <button type="button" onClick={uncomplete}>
                  Uncomplete
                </button>
                <span>{isCompleted ? 'Done' : 'Not Done'}</span>
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

    it('provides execute function', async () => {
      const user = userEvent.setup()
      const handler = vi.fn()
      const checklistWithCallback = {
        id: 'callback-checklist',
        title: 'Callback',
        tasks: [
          {
            id: 'callback-task',
            title: 'Callback Task',
            action: { type: 'callback' as const, handler },
          },
        ],
      }

      const Wrapper = createWrapper({ checklists: [checklistWithCallback] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="callback-checklist"
            taskId="callback-task"
            render={({ execute }) => (
              <button type="button" onClick={execute}>
                Execute
              </button>
            )}
          />
        </Wrapper>
      )

      await user.click(screen.getByText('Execute'))

      expect(handler).toHaveBeenCalled()
    })

    it('provides toggle function', async () => {
      const user = userEvent.setup()
      const Wrapper = createWrapper({ checklists: [mockNoDepsChecklist] })

      render(
        <Wrapper>
          <TaskHeadless
            checklistId="no-deps-checklist"
            taskId="task-a"
            render={({ toggle, isCompleted }) => (
              <button type="button" onClick={toggle}>
                {isCompleted ? 'Done' : 'Not Done'}
              </button>
            )}
          />
        </Wrapper>
      )

      expect(screen.getByText('Not Done')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Done')).toBeInTheDocument()

      await user.click(screen.getByRole('button'))
      expect(screen.getByText('Not Done')).toBeInTheDocument()
    })
  })

  describe('edge cases', () => {
    it('returns null for invalid checklist ID', () => {
      const renderFn = vi.fn(() => <div>Content</div>)
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <TaskHeadless checklistId="non-existent" taskId="task-1" render={renderFn} />
        </Wrapper>
      )

      expect(renderFn).not.toHaveBeenCalled()
    })
  })
})
