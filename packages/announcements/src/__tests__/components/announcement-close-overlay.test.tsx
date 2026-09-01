import { fireEvent, render, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { AnnouncementClose } from '../../components/announcement-close'
import { AnnouncementOverlay } from '../../components/announcement-overlay'

describe('AnnouncementClose', () => {
  it('renders a labelled close button with the default icon', () => {
    render(<AnnouncementClose />)
    const btn = screen.getByRole('button', { name: 'Close' })
    expect(btn).toHaveAttribute('type', 'button')
    expect(btn.querySelector('svg')).not.toBeNull()
  })

  it('fires onClose on click', () => {
    const onClose = vi.fn()
    render(<AnnouncementClose onClose={onClose} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('still runs onClick, and skips onClose when the event is defaultPrevented', () => {
    const onClose = vi.fn()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    render(<AnnouncementClose onClose={onClose} onClick={onClick} />)
    fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })

  it('renders custom children instead of the default icon', () => {
    render(<AnnouncementClose>Dismiss</AnnouncementClose>)
    expect(screen.getByRole('button', { name: 'Close' })).toHaveTextContent('Dismiss')
  })
})

describe('AnnouncementOverlay', () => {
  it('renders nothing when open is false', () => {
    const { container } = render(<AnnouncementOverlay open={false} />)
    expect(container.firstChild).toBeNull()
  })

  it('renders an aria-hidden overlay and fires onClose on click', () => {
    const onClose = vi.fn()
    const { container } = render(<AnnouncementOverlay onClose={onClose} />)
    const overlay = container.querySelector('div[aria-hidden="true"]')
    expect(overlay).not.toBeNull()
    expect(overlay).toHaveAttribute('data-state', 'open')

    fireEvent.click(overlay as Element)
    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose when click is defaultPrevented by consumer onClick', () => {
    const onClose = vi.fn()
    const onClick = vi.fn((e: React.MouseEvent) => e.preventDefault())
    const { container } = render(<AnnouncementOverlay onClose={onClose} onClick={onClick} />)
    fireEvent.click(container.querySelector('div[aria-hidden="true"]') as Element)
    expect(onClick).toHaveBeenCalledTimes(1)
    expect(onClose).not.toHaveBeenCalled()
  })
})
