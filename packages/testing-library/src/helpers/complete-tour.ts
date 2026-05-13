import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourKitTestingError } from '../error'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface CompleteTourOptions {
  /** Overall deadline. Defaults to 5000ms. */
  timeout?: number
  /** Hard cap on click iterations. Defaults to 50. */
  maxSteps?: number
  user?: UserEvent
}

export async function completeTour(tourId: string, opts: CompleteTourOptions = {}): Promise<void> {
  const { timeout = 5000, maxSteps = 50 } = opts
  const user = opts.user ?? userEvent.setup()
  const start = Date.now()

  for (let i = 0; i < maxSteps; i++) {
    if (Date.now() - start > timeout) {
      throw new TourKitTestingError(
        `completeTour: tour "${tourId}" not complete within ${timeout}ms`,
        { tourId }
      )
    }
    // Flush before query so the previous click's state lands first.
    await act(async () => {})
    const btn = screen.queryByRole('button', { name: /next|finish|done/i })
    if (!btn) return
    await user.click(btn)
  }
  throw new TourKitTestingError(
    `completeTour: tour "${tourId}" exceeded ${maxSteps} click iterations`,
    { tourId }
  )
}
