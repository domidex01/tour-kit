import { render } from '@testing-library/react'
import { LocaleProvider, SegmentationProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'

/**
 * Test helper that mounts `<SegmentationProvider>` (for `userContext`-driven
 * interpolation) wrapped around `<LocaleProvider>` (for `messages`-driven
 * `{ key }` lookups), so survey specs can assert on resolved DOM text without
 * re-implementing the providers each time.
 *
 * Phase 3a established `<SegmentationProvider userContext>` as the single
 * source for interpolation vars — `<LocaleProvider>` does not own that data.
 */
export function renderWithLocale(
  ui: ReactNode,
  opts: { messages?: Record<string, string>; userContext?: Record<string, unknown> } = {}
) {
  return render(
    <SegmentationProvider segments={{}} userContext={opts.userContext}>
      <LocaleProvider locale="en" messages={opts.messages ?? {}}>
        {ui}
      </LocaleProvider>
    </SegmentationProvider>
  )
}
