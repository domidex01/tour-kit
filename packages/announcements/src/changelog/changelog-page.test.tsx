import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { LocaleProvider } from '@tour-kit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { MOCK_ENTRIES, mockReducedMotion } from './__test-helpers__'
import { ChangelogPage } from './changelog-page'

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('<ChangelogPage>', () => {
  beforeEach(() => {
    mockReducedMotion(false)
  })

  describe('rendering', () => {
    it('renders without a router context', () => {
      expect(() => render(<ChangelogPage entries={MOCK_ENTRIES} />)).not.toThrow()
    })

    it('shows the English fallback empty state when entries=[]', () => {
      render(<ChangelogPage entries={[]} />)
      expect(screen.getByText('No changelog entries yet')).toBeInTheDocument()
    })

    it('localizes the empty state via LocaleProvider', () => {
      render(
        <LocaleProvider locale="es" messages={{ 'changelog.empty': 'Aún no hay novedades' }}>
          <ChangelogPage entries={[]} />
        </LocaleProvider>
      )
      expect(screen.getByText('Aún no hay novedades')).toBeInTheDocument()
    })

    it('renders one <article> per entry', () => {
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })
  })

  describe('uncontrolled filter', () => {
    it('lists all derived categories plus an "All" reset button', () => {
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      expect(screen.getByRole('button', { name: 'All' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Performance' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Bugfixes' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Features' })).toBeInTheDocument()
    })

    it('clicking a category narrows the entry list; "All" restores', async () => {
      const user = userEvent.setup()
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      expect(screen.getAllByRole('article')).toHaveLength(3)

      await user.click(screen.getByRole('button', { name: 'Performance' }))
      const articles = screen.getAllByRole('article')
      expect(articles).toHaveLength(1)
      expect(within(articles[0]).getByText(/Performance: 30% faster boot/)).toBeInTheDocument()

      await user.click(screen.getByRole('button', { name: 'All' }))
      expect(screen.getAllByRole('article')).toHaveLength(3)
    })

    it('marks the selected filter button with aria-pressed=true', async () => {
      const user = userEvent.setup()
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      const allBtn = screen.getByRole('button', { name: 'All' })
      const perfBtn = screen.getByRole('button', { name: 'Performance' })
      expect(allBtn).toHaveAttribute('aria-pressed', 'true')
      expect(perfBtn).toHaveAttribute('aria-pressed', 'false')

      await user.click(perfBtn)
      expect(perfBtn).toHaveAttribute('aria-pressed', 'true')
      expect(allBtn).toHaveAttribute('aria-pressed', 'false')
    })
  })

  describe('controlled mode', () => {
    it('calls onCategoryChange and does NOT mutate internal state', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <ChangelogPage entries={MOCK_ENTRIES} category="Performance" onCategoryChange={onChange} />
      )

      await user.click(screen.getByRole('button', { name: 'Bugfixes' }))
      expect(onChange).toHaveBeenCalledOnce()
      expect(onChange).toHaveBeenCalledWith('Bugfixes')

      // Internal state untouched: prop still drives the filter to "Performance".
      const articles = screen.getAllByRole('article')
      expect(articles).toHaveLength(1)
      expect(within(articles[0]).getByText(/Performance: 30% faster boot/)).toBeInTheDocument()
    })

    it('passes null when "All" is clicked in controlled mode', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(
        <ChangelogPage entries={MOCK_ENTRIES} category="Performance" onCategoryChange={onChange} />
      )
      await user.click(screen.getByRole('button', { name: 'All' }))
      expect(onChange).toHaveBeenCalledWith(null)
    })
  })

  describe('MediaSlot integration', () => {
    it('renders <MediaSlot> only for entries with media set', () => {
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      // Only evt-3 (SSO) carries `media`. Its YouTube URL renders an <iframe>.
      expect(document.querySelectorAll('iframe').length).toBe(1)
    })
  })

  describe('reactions', () => {
    it('forwards onReact from page to entry buttons', async () => {
      const user = userEvent.setup()
      const onReact = vi.fn()
      render(<ChangelogPage entries={MOCK_ENTRIES} onReact={onReact} />)
      const entry1 = screen.getAllByRole('article')[0]
      await user.click(within(entry1).getByRole('button', { name: 'Thumbs up' }))
      expect(onReact).toHaveBeenCalledWith('evt-1', '👍')
    })
  })

  describe('keyboard navigation', () => {
    it('Tab → ArrowDown → Enter cycles and activates filter buttons', async () => {
      const user = userEvent.setup()
      const onChange = vi.fn()
      render(<ChangelogPage entries={MOCK_ENTRIES} category={null} onCategoryChange={onChange} />)

      await user.tab()
      expect(screen.getByRole('button', { name: 'All' })).toHaveFocus()

      await user.keyboard('{ArrowDown}')
      expect(screen.getByRole('button', { name: 'Performance' })).toHaveFocus()

      await user.keyboard('{Enter}')
      expect(onChange).toHaveBeenCalledWith('Performance')
    })

    it('ArrowUp wraps from the first option to the last', async () => {
      const user = userEvent.setup()
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      await user.tab()
      await user.keyboard('{ArrowUp}')
      expect(screen.getByRole('button', { name: 'Features' })).toHaveFocus()
    })
  })

  describe('reduced motion', () => {
    it('keeps the motion-safe:animate-in class on entries (CSS gates it browser-side)', () => {
      mockReducedMotion(true)
      render(<ChangelogPage entries={MOCK_ENTRIES} />)
      const articles = screen.getAllByRole('article')
      // jsdom does not evaluate `@media` queries; the documented contract is
      // that the `motion-safe:` Tailwind utility is emitted in classnames and
      // CSS gates it browser-side.
      for (const article of articles) {
        expect(article.className).toMatch(/motion-safe:animate-in/)
      }
    })
  })
})
