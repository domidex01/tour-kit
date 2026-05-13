import userEvent from '@testing-library/user-event'
import { clickButtonByName } from './_click-by-name'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface SkipTourOptions {
  user?: UserEvent
}

export async function skipTour(opts: SkipTourOptions = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  await clickButtonByName(user, /skip/i, 'skipTour: no Skip button found')
}
