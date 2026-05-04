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
  segments?: Record<string, SegmentSource | (() => boolean)>
  currentUserId?: string
}

/**
 * Mirror of `@tour-kit/hints` and `@tour-kit/react` test helpers — duplicated
 * per-package on purpose so announcements does not need a runtime dep on
 * either sibling. Wraps `<LocaleProvider>` + `<SegmentationProvider>` and
 * provides a sugar shorthand for `segments: { name: () => true|false }`
 * that expands to a probe-keyed `AudienceCondition[]` so segment evaluation
 * resolves under the real `useSegments()` hook.
 */
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
