import { type RenderResult, render } from '@testing-library/react'
import {
  LocaleProvider,
  type Messages,
  type SegmentSource,
  SegmentationProvider,
} from '@tour-kit/core'
import type { ReactNode } from 'react'

const PROBE_KEY = '__test_segment_present__'

interface RenderOptions {
  locale?: string
  messages?: Messages
  userContext?: Record<string, unknown>
  /**
   * Test-only convenience: pass `() => boolean` to express a static segment
   * decision. Wrapped into an `AudienceCondition` against a probe key so the
   * real `matchesAudience` runs. Real `SegmentSource` values are forwarded
   * unchanged.
   */
  segments?: Record<string, SegmentSource | (() => boolean)>
  currentUserId?: string
}

export function renderWithProviders(ui: ReactNode, opts: RenderOptions = {}): RenderResult {
  const compiledSegments: Record<string, SegmentSource> = {}
  for (const [name, value] of Object.entries(opts.segments ?? {})) {
    if (typeof value === 'function') {
      compiledSegments[name] = value()
        ? [{ type: 'user_property', key: PROBE_KEY, operator: 'exists' }]
        : [{ type: 'user_property', key: PROBE_KEY, operator: 'not_exists' }]
    } else {
      compiledSegments[name] = value
    }
  }
  const userContext = {
    ...(opts.userContext ?? {}),
    [PROBE_KEY]: 'present',
  }
  return render(
    <LocaleProvider locale={opts.locale ?? 'en'} messages={opts.messages ?? {}}>
      <SegmentationProvider
        segments={compiledSegments}
        userContext={userContext}
        currentUserId={opts.currentUserId}
      >
        {ui}
      </SegmentationProvider>
    </LocaleProvider>
  )
}
