import { LocaleProvider } from '@tour-kit/core'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Reactions } from './reactions'

describe('<Reactions>', () => {
  it('renders 3 buttons with English fallback aria-labels', () => {
    render(<Reactions entryId="evt-1" />)
    expect(screen.getByRole('button', { name: 'Thumbs up' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Neutral' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Thumbs down' })).toBeInTheDocument()
  })

  it('clicking thumbs up fires onReact(entryId, "👍")', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    render(<Reactions entryId="evt-1" onReact={onReact} />)
    await user.click(screen.getByRole('button', { name: 'Thumbs up' }))
    expect(onReact).toHaveBeenCalledOnce()
    expect(onReact).toHaveBeenCalledWith('evt-1', '👍')
  })

  it('clicking the other reactions fires the matching emoji', async () => {
    const user = userEvent.setup()
    const onReact = vi.fn()
    render(<Reactions entryId="evt-2" onReact={onReact} />)
    await user.click(screen.getByRole('button', { name: 'Neutral' }))
    expect(onReact).toHaveBeenLastCalledWith('evt-2', '😐')
    await user.click(screen.getByRole('button', { name: 'Thumbs down' }))
    expect(onReact).toHaveBeenLastCalledWith('evt-2', '👎')
  })

  it('does not throw when onReact is undefined', async () => {
    const user = userEvent.setup()
    render(<Reactions entryId="evt-3" />)
    await expect(
      user.click(screen.getByRole('button', { name: 'Thumbs up' }))
    ).resolves.toBeUndefined()
  })

  it('localizes aria-labels via LocaleProvider', () => {
    render(
      <LocaleProvider
        locale="es"
        messages={{
          'changelog.reaction.thumbs_up': 'Pulgar arriba',
          'changelog.reaction.neutral': 'Neutral',
          'changelog.reaction.thumbs_down': 'Pulgar abajo',
        }}
      >
        <Reactions entryId="evt-1" />
      </LocaleProvider>
    )
    expect(screen.getByRole('button', { name: 'Pulgar arriba' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Pulgar abajo' })).toBeInTheDocument()
  })
})
