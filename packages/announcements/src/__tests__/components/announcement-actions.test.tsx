import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementActions } from '../../components/announcement-actions'

describe('AnnouncementActions', () => {
  it('renders nothing when there are no actions or children', () => {
    const { container } = render(<AnnouncementActions />)
    expect(container.firstChild).toBeNull()
  })

  it('renders primary and secondary buttons and fires their onClick + onAction', () => {
    const onPrimary = vi.fn()
    const onSecondary = vi.fn()
    const onAction = vi.fn()

    render(
      <AnnouncementActions
        primaryAction={{ label: 'Confirm', onClick: onPrimary }}
        secondaryAction={{ label: 'Later', onClick: onSecondary }}
        onAction={onAction}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Confirm' }))
    expect(onPrimary).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('primary')

    fireEvent.click(screen.getByRole('button', { name: 'Later' }))
    expect(onSecondary).toHaveBeenCalledTimes(1)
    expect(onAction).toHaveBeenCalledWith('secondary')
  })

  it('calls onDismiss when an action has dismissOnClick', () => {
    const onDismiss = vi.fn()
    render(
      <AnnouncementActions
        primaryAction={{ label: 'Go', dismissOnClick: true }}
        onDismiss={onDismiss}
      />
    )

    fireEvent.click(screen.getByRole('button', { name: 'Go' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })

  it('does not call onDismiss when dismissOnClick is absent', () => {
    const onDismiss = vi.fn()
    render(<AnnouncementActions primaryAction={{ label: 'Stay' }} onDismiss={onDismiss} />)

    fireEvent.click(screen.getByRole('button', { name: 'Stay' }))
    expect(onDismiss).not.toHaveBeenCalled()
  })

  it('renders an action with href as an anchor', () => {
    render(<AnnouncementActions primaryAction={{ label: 'Docs', href: '/docs' }} />)
    const link = screen.getByRole('link', { name: 'Docs' })
    expect(link).toHaveAttribute('href', '/docs')
  })
})
