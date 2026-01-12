import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'
import { ChecklistTask } from '../../components/checklist-task'
import { createMockTaskState } from '../test-utils'

describe('ChecklistTask', () => {
  describe('visibility', () => {
    it('renders when task.visible is true', () => {
      const task = createMockTaskState({ visible: true })

      render(<ChecklistTask task={task} />)

      // Component renders a div with role="button" containing the task
      expect(screen.getByText('Test Task')).toBeInTheDocument()
    })

    it('returns null when task.visible is false', () => {
      const task = createMockTaskState({ visible: false })

      const { container } = render(<ChecklistTask task={task} />)

      expect(container.firstChild).toBeNull()
    })
  })

  describe('content rendering', () => {
    it('displays task title', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test Task Title' },
      })

      render(<ChecklistTask task={task} />)

      expect(screen.getByText('Test Task Title')).toBeInTheDocument()
    })

    it('displays task description when present', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test', description: 'Task description here' },
      })

      render(<ChecklistTask task={task} />)

      expect(screen.getByText('Task description here')).toBeInTheDocument()
    })

    it('does not render description when not provided', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test', description: undefined },
      })

      render(<ChecklistTask task={task} />)

      // Only title should be present, no description text
      expect(screen.queryByText('Test task description')).not.toBeInTheDocument()
    })

    it('renders custom icon when provided', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test', icon: <span data-testid="custom-icon">Icon</span> },
      })

      render(<ChecklistTask task={task} />)

      expect(screen.getByTestId('custom-icon')).toBeInTheDocument()
    })

    it('renders renderIcon callback result', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test' },
      })
      const renderIcon = vi.fn(() => <span data-testid="rendered-icon">Rendered</span>)

      render(<ChecklistTask task={task} renderIcon={renderIcon} />)

      expect(renderIcon).toHaveBeenCalledWith(task)
      expect(screen.getByTestId('rendered-icon')).toBeInTheDocument()
    })

    it('shows checkmark when completed', () => {
      const task = createMockTaskState({ completed: true })

      const { container } = render(<ChecklistTask task={task} />)

      // Should have an SVG checkmark
      const svg = container.querySelector('svg')
      expect(svg).toBeInTheDocument()
    })
  })

  describe('interactions', () => {
    it('calls onClick when clicked', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState()
      const onClick = vi.fn()

      render(<ChecklistTask task={task} onClick={onClick} />)

      await user.click(screen.getByRole('button', { name: /test task/i }))

      expect(onClick).toHaveBeenCalled()
    })

    it('does not call onClick when locked', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState({ locked: true })
      const onClick = vi.fn()

      render(<ChecklistTask task={task} onClick={onClick} />)

      await user.click(screen.getByRole('button', { name: /test task/i }))

      expect(onClick).not.toHaveBeenCalled()
    })

    it('calls onToggle when checkbox clicked', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState()
      const onToggle = vi.fn()

      render(<ChecklistTask task={task} onToggle={onToggle} />)

      const checkbox = screen.getByRole('button', { name: /mark as complete/i })
      await user.click(checkbox)

      expect(onToggle).toHaveBeenCalled()
    })

    it('stops propagation on checkbox click', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState()
      const onClick = vi.fn()
      const onToggle = vi.fn()

      render(<ChecklistTask task={task} onClick={onClick} onToggle={onToggle} />)

      const checkbox = screen.getByRole('button', { name: /mark as complete/i })
      await user.click(checkbox)

      expect(onToggle).toHaveBeenCalled()
      expect(onClick).not.toHaveBeenCalled()
    })

    it('handles Enter key press', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState()
      const onClick = vi.fn()

      render(<ChecklistTask task={task} onClick={onClick} />)

      const button = screen.getByRole('button', { name: /test task/i })
      button.focus()
      await user.keyboard('{Enter}')

      expect(onClick).toHaveBeenCalled()
    })

    it('handles Space key press', async () => {
      const user = userEvent.setup()
      const task = createMockTaskState()
      const onClick = vi.fn()

      render(<ChecklistTask task={task} onClick={onClick} />)

      const button = screen.getByRole('button', { name: /test task/i })
      button.focus()
      await user.keyboard(' ')

      expect(onClick).toHaveBeenCalled()
    })
  })

  describe('locked state', () => {
    it('sets tabIndex to -1 when locked', () => {
      const task = createMockTaskState({ locked: true })

      render(<ChecklistTask task={task} />)

      expect(screen.getByRole('button', { name: /test task/i })).toHaveAttribute('tabindex', '-1')
    })

    it('sets aria-disabled when locked', () => {
      const task = createMockTaskState({ locked: true })

      render(<ChecklistTask task={task} />)

      expect(screen.getByRole('button', { name: /test task/i })).toHaveAttribute(
        'aria-disabled',
        'true'
      )
    })

    it('disables checkbox button when locked', () => {
      const task = createMockTaskState({ locked: true })

      render(<ChecklistTask task={task} />)

      const checkbox = screen.getByRole('button', { name: /mark as complete/i })
      expect(checkbox).toBeDisabled()
    })
  })

  describe('action indicator', () => {
    it('shows arrow when task has action', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test', action: { type: 'navigate', url: '/test' } },
      })

      const { container } = render(<ChecklistTask task={task} />)

      // Arrow SVG should be present
      const svgs = container.querySelectorAll('svg')
      expect(svgs.length).toBeGreaterThan(0)
    })

    it('hides arrow when task has no action', () => {
      const task = createMockTaskState({
        config: { id: 'test', title: 'Test' },
      })

      const { container } = render(<ChecklistTask task={task} />)

      // Only checkbox button SVG (if completed)
      const svgs = container.querySelectorAll('svg[aria-hidden="true"]')
      // Should not have the arrow SVG
      const arrowSvg = Array.from(svgs).find((svg) => svg.querySelector('path[d*="9 5l7 7-7 7"]'))
      expect(arrowSvg).toBeUndefined()
    })

    it('hides arrow when task is completed', () => {
      const task = createMockTaskState({
        completed: true,
        config: { id: 'test', title: 'Test', action: { type: 'navigate', url: '/test' } },
      })

      const { container } = render(<ChecklistTask task={task} />)

      // Should not have arrow path
      const arrowSvg = Array.from(container.querySelectorAll('svg')).find((svg) =>
        svg.querySelector('path[d*="9 5l7 7-7 7"]')
      )
      expect(arrowSvg).toBeUndefined()
    })

    it('hides arrow when task is locked', () => {
      const task = createMockTaskState({
        locked: true,
        config: { id: 'test', title: 'Test', action: { type: 'navigate', url: '/test' } },
      })

      const { container } = render(<ChecklistTask task={task} />)

      const arrowSvg = Array.from(container.querySelectorAll('svg')).find((svg) =>
        svg.querySelector('path[d*="9 5l7 7-7 7"]')
      )
      expect(arrowSvg).toBeUndefined()
    })
  })

  describe('accessibility', () => {
    it('has role="button"', () => {
      const task = createMockTaskState()

      render(<ChecklistTask task={task} />)

      expect(screen.getByRole('button', { name: /test task/i })).toBeInTheDocument()
    })

    it('checkbox has accessible label', () => {
      const task = createMockTaskState()

      render(<ChecklistTask task={task} />)

      expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument()
    })

    it('checkbox aria-label changes based on completed state', () => {
      const incompleteTask = createMockTaskState({ completed: false })
      const { rerender } = render(<ChecklistTask task={incompleteTask} />)

      expect(screen.getByRole('button', { name: /mark as complete/i })).toBeInTheDocument()

      const completedTask = createMockTaskState({ completed: true })
      rerender(<ChecklistTask task={completedTask} />)

      expect(screen.getByRole('button', { name: /mark as incomplete/i })).toBeInTheDocument()
    })
  })

  describe('ref forwarding', () => {
    it('forwards ref to outer div', () => {
      const ref = { current: null }
      const task = createMockTaskState()

      render(<ChecklistTask ref={ref} task={task} />)

      expect(ref.current).toBeInstanceOf(HTMLDivElement)
    })
  })

  describe('className', () => {
    it('accepts custom className', () => {
      const task = createMockTaskState()

      const { container } = render(<ChecklistTask task={task} className="custom-class" />)

      expect(container.firstChild).toHaveClass('custom-class')
    })
  })
})
