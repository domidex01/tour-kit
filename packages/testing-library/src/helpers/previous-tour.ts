import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourKitTestingError } from '../error'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface PreviousTourOptions {
  steps?: number
  user?: UserEvent
}

export async function previousTour(opts: PreviousTourOptions = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  const steps = opts.steps ?? 1
  for (let i = 0; i < steps; i++) {
    let btn: HTMLElement
    try {
      btn = screen.getByRole('button', { name: /previous|back|prev/i })
    } catch (e) {
      throw new TourKitTestingError(
        `previousTour: no Previous/Back button found (step ${i + 1} of ${steps})`,
        { cause: e }
      )
    }
    await user.click(btn)
    await act(async () => {})
  }
}
