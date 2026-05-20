import { act, renderHook } from '@testing-library/react'
import { cleanup, render, screen } from '@testing-library/react'
import { type AnalyticsPlugin, AnalyticsProvider } from '@tour-kit/analytics'
import type * as React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

import { AnnouncementsProvider, FORCE_SHOW_BYPASS } from '../context/announcements-provider'
import { useAnnouncement } from '../hooks/use-announcement'
import type { AnnouncementConfig, AnnouncementState } from '../types/announcement'

afterEach(() => {
  cleanup()
})

// ─── §1 — Pinned literal-array snapshot ─────────────────────────────────────
// CI guarantee: a future contributor adding a new gate to show() must not
// silently bypass it via forceShow(). Adding to this array is a deliberate
// API change that breaks this test.
describe('FORCE_SHOW_BYPASS literal pin', () => {
  it('matches the Phase 0 §4 signed-off matrix verbatim — drift breaks CI', () => {
    expect(FORCE_SHOW_BYPASS).toEqual([
      'frequency',
      'cooldown',
      'viewCount',
      'isDismissed',
      'audience',
    ])
  })
})

// ─── §2 — Per-row bypass matrix ──────────────────────────────────────────────
// One test per row: prime state to make the gate BLOCKING, call forceShow,
// assert the announcement renders. Each scenario also asserts the analytics
// event fires with `metadata.trigger='forced'`.

interface ScenarioBuild {
  config: AnnouncementConfig
  state: Partial<AnnouncementState>
}

function buildWrapper({
  config,
  state,
  track,
}: {
  config: AnnouncementConfig
  state: Partial<AnnouncementState>
  track?: AnalyticsPlugin['track']
}) {
  const storage = {
    getItem: (_key: string) => {
      if (Object.keys(state).length === 0) return null
      return JSON.stringify({
        viewCount: state.viewCount ?? 0,
        lastViewedAt: state.lastViewedAt?.toISOString() ?? null,
        isDismissed: state.isDismissed ?? false,
        dismissedAt: state.dismissedAt?.toISOString() ?? null,
        dismissalReason: state.dismissalReason ?? null,
        completedAt: state.completedAt?.toISOString() ?? null,
      })
    },
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
    length: 0,
    key: () => null,
  } satisfies Storage

  return function Wrapper({ children }: { children: React.ReactNode }) {
    const inner = (
      <AnnouncementsProvider announcements={[config]} storage={storage}>
        {children}
      </AnnouncementsProvider>
    )
    if (!track) return inner
    return (
      <AnalyticsProvider config={{ plugins: [{ name: 'test', track }] }}>{inner}</AnalyticsProvider>
    )
  }
}

interface MatrixRow {
  label: string
  scenario: ScenarioBuild
}

const matrix: MatrixRow[] = [
  {
    label: 'frequency=once already viewed',
    scenario: {
      config: { id: 'a', variant: 'modal', title: 't', frequency: 'once', autoShow: false },
      state: { viewCount: 1, lastViewedAt: new Date() },
    },
  },
  {
    label: 'scheduler cooldown active (frequency interval)',
    scenario: {
      config: {
        id: 'a',
        variant: 'modal',
        title: 't',
        // 24h interval, just viewed → cooldown active
        frequency: { type: 'interval', days: 1 },
        autoShow: false,
      },
      state: { viewCount: 1, lastViewedAt: new Date() },
    },
  },
  {
    label: 'viewCount >= maxViews (frequency.times)',
    scenario: {
      config: {
        id: 'a',
        variant: 'modal',
        title: 't',
        frequency: { type: 'times', count: 1 },
        autoShow: false,
      },
      state: { viewCount: 1 },
    },
  },
  {
    label: 'isDismissed=true',
    scenario: {
      config: { id: 'a', variant: 'modal', title: 't', autoShow: false },
      state: {
        isDismissed: true,
        dismissedAt: new Date(),
        dismissalReason: 'programmatic',
      },
    },
  },
  {
    label: 'audience: segment mismatch (admin-only, current user not admin)',
    scenario: {
      config: {
        id: 'a',
        variant: 'modal',
        title: 't',
        autoShow: false,
        audience: { segment: 'admins' },
      },
      state: {},
    },
  },
]

describe('forceShow bypass matrix — one test per Phase 0 §4 row', () => {
  it.each(matrix)('bypasses $label and renders the announcement', ({ scenario }) => {
    const track = vi.fn<AnalyticsPlugin['track']>()
    const wrapper = buildWrapper({ ...scenario, track })

    const { result } = renderHook(() => useAnnouncement('a'), { wrapper })

    // Sanity: without forceShow, the regular show() would no-op for any of
    // these rows. (canShow may also report false depending on the row.)
    act(() => {
      result.current.show()
    })
    // The `show()` call should NOT have rendered (gate blocking), so isVisible
    // remains false. Some rows still let show() through (e.g. isDismissed sets
    // a hard guard, others use the scheduler), but in all 5 cases forceShow
    // must produce isVisible=true.
    act(() => {
      result.current.forceShow()
    })

    expect(result.current.state?.isVisible).toBe(true)
    expect(result.current.state?.isActive).toBe(true)
    // forceShow always clears isDismissed so a re-show works.
    expect(result.current.state?.isDismissed).toBe(false)

    expect(track).toHaveBeenCalledWith(
      expect.objectContaining({
        eventName: 'announcement_shown',
        tourId: 'a',
        metadata: expect.objectContaining({
          announcementId: 'a',
          trigger: 'forced',
        }),
      })
    )
  })

  it('still increments viewCount on forceShow so admins see real telemetry deltas', () => {
    const wrapper = buildWrapper({
      config: { id: 'a', variant: 'modal', title: 't', autoShow: false },
      state: { viewCount: 3 },
    })

    const { result } = renderHook(() => useAnnouncement('a'), { wrapper })
    const before = result.current.state?.viewCount ?? 0
    act(() => {
      result.current.forceShow()
    })
    expect(result.current.state?.viewCount).toBe(before + 1)
  })
})

// ─── §3 — License soft-gate boundary ────────────────────────────────────────
// forceShow MUST NOT bypass LicenseGate. The license gate is a soft wrapper
// that renders children AND overlays a watermark when unlicensed — calling
// forceShow on an unlicensed provider must leave the watermark intact.

describe('forceShow — LicenseGate soft boundary preserved', () => {
  beforeEach(() => {
    vi.resetModules()
    vi.doMock('@tour-kit/license', () => ({
      LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => (
        <>
          {children}
          <div data-testid="license-watermark">Tour Kit · Unlicensed</div>
        </>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('forceShow under an unlicensed LicenseGate still shows the watermark', async () => {
    // Re-import BOTH the provider and the context hook from the same module
    // graph reset by vi.doMock — otherwise the static import at the top of
    // this file references a different React Context object than the freshly
    // re-imported provider sets, and the hook throws "must be used within".
    const { AnnouncementsProvider } = await import('../context/announcements-provider')
    const { useAnnouncementsContext } = await import('../context/announcements-context')

    function ForceShowProbe() {
      const ctx = useAnnouncementsContext()
      return (
        <button type="button" data-testid="force" onClick={() => ctx.forceShow('a')}>
          Force
        </button>
      )
    }

    render(
      <AnnouncementsProvider
        announcements={[{ id: 'a', variant: 'modal', title: 't', autoShow: false }]}
        storage={null}
      >
        <ForceShowProbe />
      </AnnouncementsProvider>
    )

    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()

    act(() => {
      screen.getByTestId('force').click()
    })

    // Post-forceShow, the watermark survives — the license wrapper is NOT bypassed.
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
  })
})
