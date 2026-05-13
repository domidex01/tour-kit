import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourKitTestingError } from '../error'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface AdvanceTourOptions {
  /** Number of times to click Next. Defaults to 1. */
  steps?: number
  /** Reuse an existing userEvent instance (recommended for multi-helper tests). */
  user?: UserEvent
}

export async function advanceTour(opts: AdvanceTourOptions = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  const steps = opts.steps ?? 1
  for (let i = 0; i < steps; i++) {
    let btn: HTMLElement
    try {
      btn = screen.getByRole('button', { name: /next|finish|done/i })
    } catch (e) {
      throw new TourKitTestingError(
        `advanceTour: no Next/Finish/Done button found (step ${i + 1} of ${steps})`,
        { cause: e }
      )
    }
    await user.click(btn)
    await act(async () => {})
  }
}
