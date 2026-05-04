import { render } from '@testing-library/react'
import { LocaleProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'

/**
 * Test helper that mounts a `<LocaleProvider>` wrapped around `ui` so survey
 * specs can assert on resolved DOM text without re-implementing the provider
 * each time.
 */
export function renderWithLocale(
  ui: ReactNode,
  opts: { messages?: Record<string, string>; userContext?: Record<string, unknown> } = {}
) {
  return render(
    <LocaleProvider locale="en" messages={opts.messages ?? {}} userContext={opts.userContext}>
      {ui}
    </LocaleProvider>
  )
}
