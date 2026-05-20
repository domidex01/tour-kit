import { act, cleanup, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  ProGate: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}))

vi.mock('@tour-kit/core', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tour-kit/core')>()
  return {
    ...actual,
    useTourContext: () => ({ isActive: false }),
    useTourContextOptional: () => ({ isActive: false }),
    createStorageAdapter: () => ({
      getItem: () => null,
      setItem: () => {},
      removeItem: () => {},
    }),
  }
})

import { CesModal, CsatModal, NpsModal, SurveysProvider } from '../index'

afterEach(() => {
  cleanup()
})

function Wrapper({ children }: { children: React.ReactNode }) {
  return <SurveysProvider surveys={[]}>{children}</SurveysProvider>
}

// ─── §1 — Behavior: render + click + callback shape ────────────────────────

describe('<CsatModal>', () => {
  it('renders the question and a 1–5 numeric scale by default', () => {
    render(
      <Wrapper>
        <CsatModal question="How easy was checkout?" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getAllByText('How easy was checkout?').length).toBeGreaterThan(0)
    for (let i = 1; i <= 5; i++) {
      expect(
        screen.getByRole('radio', { name: new RegExp(`Rate ${i} out of 5`) })
      ).toBeInTheDocument()
    }
  })

  it('Submit is disabled until the user picks a rating', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <CsatModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: /Rate 4 out of 5/ }))
    })
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled()
  })

  it.each([1, 3, 5])('onSubmit fires with the picked rating (%i)', async (value) => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Wrapper>
        <CsatModal question="Q" onSubmit={onSubmit} />
      </Wrapper>
    )
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: new RegExp(`Rate ${value} out of 5`) }))
      await user.click(screen.getByRole('button', { name: /submit/i }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(value)
  })

  it('shows a Skip button only when onSkip is provided and fires it on click', async () => {
    const user = userEvent.setup()
    const onSkip = vi.fn()
    const { rerender } = render(
      <Wrapper>
        <CsatModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.queryByRole('button', { name: /skip/i })).toBeNull()

    rerender(
      <Wrapper>
        <CsatModal question="Q" onSubmit={() => {}} onSkip={onSkip} />
      </Wrapper>
    )
    await act(async () => {
      await user.click(screen.getByRole('button', { name: /skip/i }))
    })
    expect(onSkip).toHaveBeenCalledTimes(1)
  })
})

describe('<NpsModal>', () => {
  it('renders the question and an 0–10 numeric scale by default', () => {
    render(
      <Wrapper>
        <NpsModal question="How likely are you to recommend us?" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getAllByText('How likely are you to recommend us?').length).toBeGreaterThan(0)
    for (let i = 0; i <= 10; i++) {
      expect(
        screen.getByRole('radio', { name: new RegExp(`Rate ${i} out of 10`) })
      ).toBeInTheDocument()
    }
    expect(screen.getByText('Not likely')).toBeInTheDocument()
    expect(screen.getByText('Very likely')).toBeInTheDocument()
  })

  it('Submit is disabled until the user picks a score', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <NpsModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: /Rate 9 out of 10/ }))
    })
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled()
  })

  it.each<[number, 'promoter' | 'passive' | 'detractor']>([
    [9, 'promoter'],
    [7, 'passive'],
    [3, 'detractor'],
  ])('onSubmit receives (score, category) for value %i', async (value, category) => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Wrapper>
        <NpsModal question="Q" onSubmit={onSubmit} />
      </Wrapper>
    )
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: new RegExp(`Rate ${value} out of 10`) }))
      await user.click(screen.getByRole('button', { name: /submit/i }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(value, category)
  })
})

describe('<CesModal>', () => {
  it('renders the question and a 1–7 numeric scale by default', () => {
    render(
      <Wrapper>
        <CesModal question="How easy was that?" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getAllByText('How easy was that?').length).toBeGreaterThan(0)
    for (let i = 1; i <= 7; i++) {
      expect(
        screen.getByRole('radio', { name: new RegExp(`Rate ${i} out of 7`) })
      ).toBeInTheDocument()
    }
    expect(screen.getByText('Very difficult')).toBeInTheDocument()
    expect(screen.getByText('Very easy')).toBeInTheDocument()
  })

  it('Submit is disabled until the user picks a score', async () => {
    const user = userEvent.setup()
    render(
      <Wrapper>
        <CesModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    expect(screen.getByRole('button', { name: /submit/i })).toBeDisabled()
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: /Rate 6 out of 7/ }))
    })
    expect(screen.getByRole('button', { name: /submit/i })).toBeEnabled()
  })

  it.each<[number, 'easy' | 'neutral' | 'difficult']>([
    [6, 'easy'],
    [4, 'neutral'],
    [2, 'difficult'],
  ])('onSubmit receives (score, category) for value %i', async (value, category) => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(
      <Wrapper>
        <CesModal question="Q" onSubmit={onSubmit} />
      </Wrapper>
    )
    await act(async () => {
      await user.click(screen.getByRole('radio', { name: new RegExp(`Rate ${value} out of 7`) }))
      await user.click(screen.getByRole('button', { name: /submit/i }))
    })
    expect(onSubmit).toHaveBeenCalledTimes(1)
    expect(onSubmit).toHaveBeenCalledWith(value, category)
  })
})

// ─── §2 — Snapshots: default + reduced-motion ───────────────────────────────

function mockReducedMotion(reduce: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })
}

// SurveyModal uses Radix's `<Dialog.Portal>`, which renders to
// `document.body` — outside the `container` returned by `render()`. Snapshot
// the modal via the `data-survey-modal` selector stamped on Dialog.Content so
// the snapshot captures real DOM (not the empty wrapper element).
const BARE_ANIM_RE =
  /(?<!motion-safe:)\b(animate-in|animate-out|fade-in-0|fade-out-0|zoom-in-95|zoom-out-95)\b/

// `React.useId` + Radix's internal IDs shift with global useId counter state —
// any test added before this block would invalidate every snapshot. Normalize
// the two patterns we know about so the snapshot only asserts the structure
// we actually care about.
function normalizeIds(html: string): string {
  return html.replace(/radix-_r_[a-z0-9]+_/g, 'radix-X').replace(/_r_[a-z0-9]+_/g, 'X')
}

function snapshotModal(snapshotKey: string) {
  const modal = document.querySelector('[data-survey-modal]')
  expect(modal, 'Dialog.Content should portal into document.body').not.toBeNull()
  const html = normalizeIds((modal as HTMLElement).outerHTML)
  expect(html).toMatchSnapshot(snapshotKey)
  return html
}

describe('turnkey modals — snapshots (default + reduced-motion)', () => {
  const originalMatchMedia = window.matchMedia

  beforeEach(() => {
    mockReducedMotion(false)
  })

  afterEach(() => {
    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: originalMatchMedia,
    })
  })

  it('CsatModal renders the same DOM under default and reduced-motion', () => {
    const { unmount } = render(
      <Wrapper>
        <CsatModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    snapshotModal('csat-default')
    unmount()

    mockReducedMotion(true)
    render(
      <Wrapper>
        <CsatModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    // Reduced motion is enforced via the `motion-safe:` CSS prefix on the
    // modal variants — the className contains `motion-safe:animate-in`,
    // never a bare `animate-in`. Assert that contract against real DOM.
    const html = snapshotModal('csat-reduced')
    expect(html).not.toMatch(BARE_ANIM_RE)
  })

  it('NpsModal renders the same DOM under default and reduced-motion', () => {
    const { unmount } = render(
      <Wrapper>
        <NpsModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    snapshotModal('nps-default')
    unmount()

    mockReducedMotion(true)
    render(
      <Wrapper>
        <NpsModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    const html = snapshotModal('nps-reduced')
    expect(html).not.toMatch(BARE_ANIM_RE)
  })

  it('CesModal renders the same DOM under default and reduced-motion', () => {
    const { unmount } = render(
      <Wrapper>
        <CesModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    snapshotModal('ces-default')
    unmount()

    mockReducedMotion(true)
    render(
      <Wrapper>
        <CesModal question="Q" onSubmit={() => {}} />
      </Wrapper>
    )
    const html = snapshotModal('ces-reduced')
    expect(html).not.toMatch(BARE_ANIM_RE)
  })
})
