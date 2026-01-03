import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { TourPortal } from './tour-portal'

describe('TourPortal', () => {
  it('renders children after mount', async () => {
    render(
      <TourPortal>
        <div data-testid="portal-content">Portal Content</div>
      </TourPortal>
    )

    // Wait for mount effect - portal renders to body
    await waitFor(() => {
      expect(screen.getByTestId('portal-content')).toBeInTheDocument()
    })
  })

  it('renders to custom container', async () => {
    const customContainer = document.createElement('div')
    customContainer.id = 'portal-root'
    document.body.appendChild(customContainer)

    render(
      <TourPortal container={customContainer}>
        <div data-testid="content">Content</div>
      </TourPortal>
    )

    await waitFor(() => {
      const content = screen.getByTestId('content')
      // Content is wrapped in a div for ref, which is inside the container
      expect(content.parentElement?.parentElement).toBe(customContainer)
    })
  })

  it('renders children in body by default', async () => {
    render(
      <TourPortal>
        <div data-testid="body-content">Body Content</div>
      </TourPortal>
    )

    await waitFor(() => {
      const content = screen.getByTestId('body-content')
      // Content is wrapped in a div for ref, which is inside body
      expect(content.parentElement?.parentElement).toBe(document.body)
    })
  })
})
