import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { Checklist } from '../../components/checklist'
import type { ChecklistConfig } from '../../types'
import {
  createWrapper,
  mockBasicChecklist,
  mockDismissibleChecklist,
  mockHideOnCompleteChecklist,
  mockNoDepsChecklist,
} from '../test-utils'

// Helper to render Checklist with provider
function renderChecklist(
  checklistId: string,
  props: Partial<React.ComponentProps<typeof Checklist>> = {},
  checklists: ChecklistConfig[] = [mockBasicChecklist]
) {
  const Wrapper = createWrapper({ checklists })
  return render(
    <Wrapper>
      <Checklist checklistId={checklistId} {...props} />
    </Wrapper>
  )
}

describe('Checklist', () => {
  describe('rendering conditions', () => {
    it('renders when checklist exists', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByText('Basic Checklist')).toBeInTheDocument()
    })

    it('returns null for invalid checklistId', () => {
      renderChecklist('non-existent')

      // No checklist content should be rendered
      expect(screen.queryByRole('heading')).not.toBeInTheDocument()
      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('returns null when dismissed', async () => {
      const user = userEvent.setup()
      renderChecklist('dismissible-checklist', {}, [mockDismissibleChecklist])

      // Find and click dismiss button
      const dismissButton = screen.getByRole('button', { name: /dismiss/i })
      await user.click(dismissButton)

      // Checklist should be gone
      expect(screen.queryByText('Basic Checklist')).not.toBeInTheDocument()
    })

    it('returns null when complete and hideOnComplete is true', () => {
      // First complete all tasks
      const Wrapper = createWrapper({ checklists: [mockHideOnCompleteChecklist] })
      render(
        <Wrapper>
          <Checklist checklistId="hide-on-complete" />
        </Wrapper>
      )

      // Initially visible
      expect(screen.getByText('Basic Checklist')).toBeInTheDocument()
    })

    it('renders when complete and hideOnComplete is false', () => {
      renderChecklist('no-deps-checklist', {}, [mockNoDepsChecklist])

      expect(screen.getByText('No Dependencies Checklist')).toBeInTheDocument()
    })
  })

  describe('header section', () => {
    it('shows header when showHeader is true (default)', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByText('Basic Checklist')).toBeInTheDocument()
    })

    it('hides header when showHeader is false', () => {
      renderChecklist('basic-checklist', { showHeader: false })

      expect(screen.queryByText('Basic Checklist')).not.toBeInTheDocument()
    })

    it('displays checklist title', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByRole('heading', { name: 'Basic Checklist' })).toBeInTheDocument()
    })

    it('displays checklist description', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByText('A simple checklist for testing')).toBeInTheDocument()
    })

    it('shows dismiss button when dismissible', () => {
      renderChecklist('dismissible-checklist', {}, [mockDismissibleChecklist])

      expect(screen.getByRole('button', { name: /dismiss/i })).toBeInTheDocument()
    })

    it('hides dismiss button when showDismiss is false', () => {
      renderChecklist('dismissible-checklist', { showDismiss: false }, [mockDismissibleChecklist])

      expect(screen.queryByRole('button', { name: /dismiss/i })).not.toBeInTheDocument()
    })

    it('dismiss button has aria-label', () => {
      renderChecklist('dismissible-checklist', {}, [mockDismissibleChecklist])

      expect(screen.getByRole('button', { name: /dismiss checklist/i })).toBeInTheDocument()
    })
  })

  describe('progress section', () => {
    it('shows progress when showProgress is true (default)', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByRole('progressbar')).toBeInTheDocument()
    })

    it('hides progress when showProgress is false', () => {
      renderChecklist('basic-checklist', { showProgress: false })

      expect(screen.queryByRole('progressbar')).not.toBeInTheDocument()
    })

    it('progress shows correct values', () => {
      renderChecklist('basic-checklist')

      expect(screen.getByText('0/3')).toBeInTheDocument()
    })
  })

  describe('task list', () => {
    it('renders all visible tasks', () => {
      renderChecklist('no-deps-checklist', {}, [mockNoDepsChecklist])

      expect(screen.getByText('Task A')).toBeInTheDocument()
      expect(screen.getByText('Task B')).toBeInTheDocument()
      expect(screen.getByText('Task C')).toBeInTheDocument()
    })

    it('uses ChecklistTask component by default', () => {
      renderChecklist('basic-checklist')

      // Should have task buttons
      expect(screen.getByText('First Task')).toBeInTheDocument()
    })

    it('uses custom renderTask when provided', () => {
      const renderTask = vi.fn((task, _actions) => (
        <div key={task.config.id} data-testid="custom-task">
          Custom: {task.config.title}
        </div>
      ))

      renderChecklist('no-deps-checklist', { renderTask }, [mockNoDepsChecklist])

      expect(screen.getAllByTestId('custom-task')).toHaveLength(3)
      expect(renderTask).toHaveBeenCalledTimes(3)
    })

    it('passes correct actions to renderTask', async () => {
      const renderTask = vi.fn((task, actions) => (
        <div key={task.config.id}>
          <button type="button" onClick={actions.execute}>
            Execute
          </button>
          <button type="button" onClick={actions.toggle}>
            Toggle
          </button>
        </div>
      ))

      renderChecklist('no-deps-checklist', { renderTask }, [mockNoDepsChecklist])

      // Actions should be functions
      expect(typeof renderTask.mock.calls[0][1].execute).toBe('function')
      expect(typeof renderTask.mock.calls[0][1].toggle).toBe('function')
    })
  })

  describe('completion state', () => {
    it('shows completion message when all tasks done', async () => {
      const user = userEvent.setup()
      renderChecklist('no-deps-checklist', {}, [mockNoDepsChecklist])

      // Complete all tasks
      const checkboxes = screen.getAllByRole('button', { name: /mark as complete/i })
      for (const checkbox of checkboxes) {
        await user.click(checkbox)
      }

      expect(screen.getByText('All tasks completed!')).toBeInTheDocument()
    })

    it('hides completion message when incomplete', () => {
      renderChecklist('basic-checklist')

      expect(screen.queryByText('All tasks completed!')).not.toBeInTheDocument()
    })
  })

  describe('asChild pattern', () => {
    it('renders div by default', () => {
      const { container } = renderChecklist('basic-checklist')

      // Find the checklist div (skip the wrapper)
      const checklistDiv = container.querySelector('[class*="rounded"]')
      expect(checklistDiv?.tagName).toBe('DIV')
    })

    it('renders as child element when asChild is true', () => {
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })
      render(
        <Wrapper>
          <Checklist checklistId="basic-checklist" asChild>
            <article data-testid="custom-element">
              <span>Content</span>
            </article>
          </Checklist>
        </Wrapper>
      )

      // The article should exist and contain the checklist content
      const article = screen.getByTestId('custom-element')
      expect(article.tagName).toBe('ARTICLE')
      // The checklist title should be inside the article
      expect(article).toContainElement(screen.getByText('Basic Checklist'))
    })
  })

  describe('className', () => {
    it('accepts custom className', () => {
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })
      const { container } = render(
        <Wrapper>
          <Checklist checklistId="basic-checklist" className="custom-class" />
        </Wrapper>
      )

      // The outermost element should have the class
      expect(container.querySelector('.custom-class')).toBeInTheDocument()
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to outer element', () => {
      const ref = { current: null }
      const Wrapper = createWrapper({ checklists: [mockBasicChecklist] })

      render(
        <Wrapper>
          <Checklist ref={ref} checklistId="basic-checklist" />
        </Wrapper>
      )

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('task interactions', () => {
    it('completing task updates progress', async () => {
      const user = userEvent.setup()
      renderChecklist('no-deps-checklist', {}, [mockNoDepsChecklist])

      expect(screen.getByText('0/3')).toBeInTheDocument()

      const checkbox = screen.getAllByRole('button', { name: /mark as complete/i })[0]
      await user.click(checkbox)

      expect(screen.getByText('1/3')).toBeInTheDocument()
    })
  })
})
