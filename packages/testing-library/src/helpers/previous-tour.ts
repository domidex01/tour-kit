import userEvent from '@testing-library/user-event'
import { clickButtonByName } from './_click-by-name'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface PreviousTourOptions {
  steps?: number
  user?: UserEvent
}

export async function previousTour(opts: PreviousTourOptions = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  const steps = opts.steps ?? 1
  for (let i = 0; i < steps; i++) {
    await clickButtonByName(
      user,
      /previous|back|prev/i,
      `previousTour: no Previous/Back button found (step ${i + 1} of ${steps})`
    )
  }
}
