import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { axe } from 'vitest-axe'
import { sampleSteps } from '../../../__tests__/_fixtures'
import { AdoptionFunnel } from '../adoption-funnel'

describe('<AdoptionFunnel>', () => {
  describe('provider-less rendering (data-first)', () => {
    it('mounts without any provider wrapper', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const labels = Array.from(container.querySelectorAll<HTMLElement>('.tk-funnel__label')).map(
        (el) => el.textContent
      )
      expect(labels).toEqual(['Viewed', 'Clicked', 'Converted'])
    })

    it('renders labels in order', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const labelEls = Array.from(container.querySelectorAll('.tk-funnel__label'))
      expect(labelEls.map((el) => el.textContent)).toEqual(['Viewed', 'Clicked', 'Converted'])
    })

    it('renders a header when `title` is provided', () => {
      render(<AdoptionFunnel steps={sampleSteps} title="Sign-up funnel" />)
      expect(screen.getByText('Sign-up funnel')).toBeInTheDocument()
    })

    it('applies an extra className to the root', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} className="extra-class" />)
      expect(container.firstChild).toHaveClass('tk-funnel')
      expect(container.firstChild).toHaveClass('extra-class')
    })
  })

  describe('metrics math', () => {
    it('shows retentionFromPrev between adjacent steps', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const retentionEls = Array.from(
        container.querySelectorAll<HTMLElement>('.tk-funnel__retention')
      ).map((el) => el.textContent)
      // 60/100 = 60.0%; 30/60 = 50.0%. First step has no retention shown.
      expect(retentionEls).toEqual(['60.0%', '50.0%'])
    })

    it('does NOT show retention on the first step', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const firstStep = container.querySelector('.tk-funnel__step')
      expect(firstStep).not.toBeNull()
      expect(firstStep?.querySelector('.tk-funnel__retention')).toBeNull()
    })

    it('bar widths are proportional to entered / max', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const bars = container.querySelectorAll<HTMLElement>('.tk-funnel__bar')
      expect(bars).toHaveLength(3)
      // 100/100 = 100%, 60/100 = 60%, 30/100 = 30%
      expect(bars[0]?.style.width).toBe('100%')
      expect(bars[1]?.style.width).toBe('60%')
      expect(bars[2]?.style.width).toBe('30%')
    })
  })

  describe('empty state', () => {
    it('renders default message when steps is empty', () => {
      render(<AdoptionFunnel steps={[]} />)
      expect(screen.getByText(/No funnel data yet/i)).toBeInTheDocument()
    })

    it('renders custom emptyState when provided', () => {
      render(<AdoptionFunnel steps={[]} emptyState={<p>nothing here</p>} />)
      expect(screen.getByText('nothing here')).toBeInTheDocument()
    })
  })

  describe('interaction', () => {
    it('invokes onStepClick with step + index', () => {
      const onClick = vi.fn()
      const { container } = render(<AdoptionFunnel steps={sampleSteps} onStepClick={onClick} />)
      const stepEls = container.querySelectorAll<HTMLElement>('.tk-funnel__step')
      expect(stepEls).toHaveLength(3)
      const clickedStep = stepEls[1]
      if (!clickedStep) throw new Error('expected step at index 1')
      fireEvent.click(clickedStep)
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'click' }), 1)
    })

    it.each([
      ['Enter', 'Enter'],
      ['Space', ' '],
    ])('activates onStepClick on %s key', (_label, key) => {
      const onClick = vi.fn()
      const { container } = render(<AdoptionFunnel steps={sampleSteps} onStepClick={onClick} />)
      const firstStep = container.querySelector<HTMLElement>('.tk-funnel__step')
      if (!firstStep) throw new Error('expected at least one step')
      fireEvent.keyDown(firstStep, { key })
      expect(onClick).toHaveBeenCalledTimes(1)
      expect(onClick).toHaveBeenCalledWith(expect.objectContaining({ id: 'view' }), 0)
    })

    it('omits role=button when onStepClick is undefined', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      expect(screen.queryAllByRole('button')).toHaveLength(0)
    })

    it('exposes role=button + tabIndex=0 when onStepClick is provided', () => {
      render(<AdoptionFunnel steps={sampleSteps} onStepClick={() => {}} />)
      const buttons = screen.getAllByRole('button')
      expect(buttons).toHaveLength(3)
      for (const btn of buttons) {
        expect(btn).toHaveAttribute('tabindex', '0')
      }
    })
  })

  describe('screen-reader fallback', () => {
    it('renders the SR table in the accessibility tree (NOT inside role="img")', () => {
      // No `hidden: true` opt-in — the table MUST be exposed to AT.
      // role="img" suppresses its descendants from the AT tree, so the table
      // is rendered as a sibling of the chart, not a child.
      render(<AdoptionFunnel steps={sampleSteps} />)
      const table = screen.getByRole('table')
      expect(table).toBeInTheDocument()
      expect(table.querySelectorAll('tbody tr')).toHaveLength(3)
      expect(table).toHaveTextContent('100')
      expect(table).toHaveTextContent('60')
      expect(table).toHaveTextContent('30')
    })

    it('SR table is a sibling of the role="img" chart, not a descendant', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const chart = container.querySelector('[role="img"]')
      const table = container.querySelector('table')
      expect(chart).not.toBeNull()
      expect(table).not.toBeNull()
      // Containment check — if the table were inside the role="img" container,
      // screen readers would treat it as decorative and skip it.
      expect(chart?.contains(table)).toBe(false)
    })

    it('SR table has visually-hidden styling via .sr-only class', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const table = container.querySelector('table')
      expect(table).not.toBeNull()
      expect(table?.className).toMatch(/sr-only/)
    })
  })

  describe('a11y', () => {
    it('passes axe with zero violations', async () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('default aria-label summarizes the funnel', () => {
      render(<AdoptionFunnel steps={sampleSteps} />)
      const chart = screen.getByRole('img')
      expect(chart.getAttribute('aria-label')).toMatch(/Adoption funnel: 100 → 60 → 30/)
    })

    it('respects ariaLabel override', () => {
      render(<AdoptionFunnel steps={sampleSteps} ariaLabel="Custom summary" />)
      expect(screen.getByRole('img').getAttribute('aria-label')).toBe('Custom summary')
    })

    it('bars carry aria-hidden so SR consumers use the table instead', () => {
      const { container } = render(<AdoptionFunnel steps={sampleSteps} />)
      const bars = container.querySelectorAll('.tk-funnel__bar')
      for (const bar of bars) {
        expect(bar).toHaveAttribute('aria-hidden', 'true')
      }
    })
  })
})
