import { render } from '@testing-library/react'
import { LocaleProvider } from '@tour-kit/core'
import { describe, expect, it } from 'vitest'

import { MOCK_ENTRIES } from './__test-helpers__'
import { ChangelogPage } from './changelog-page'

describe('<ChangelogPage> RTL', () => {
  it('applies dir="rtl" when wrapped in <LocaleProvider locale="ar">', () => {
    const { container } = render(
      <LocaleProvider locale="ar">
        <ChangelogPage entries={MOCK_ENTRIES} />
      </LocaleProvider>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('dir', 'rtl')
  })

  it('applies dir="ltr" when no locale provider mounted', () => {
    const { container } = render(<ChangelogPage entries={MOCK_ENTRIES} />)
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('dir', 'ltr')
  })

  it('honors an explicit direction override on LocaleProvider', () => {
    const { container } = render(
      <LocaleProvider locale="ar" direction="ltr">
        <ChangelogPage entries={MOCK_ENTRIES} />
      </LocaleProvider>
    )
    const root = container.firstElementChild as HTMLElement
    expect(root).toHaveAttribute('dir', 'ltr')
  })
})
