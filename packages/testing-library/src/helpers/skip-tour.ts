import { act, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TourKitTestingError } from '../error'

type UserEvent = ReturnType<typeof userEvent.setup>

export interface SkipTourOptions {
  user?: UserEvent
}

export async function skipTour(opts: SkipTourOptions = {}): Promise<void> {
  const user = opts.user ?? userEvent.setup()
  let btn: HTMLElement
  try {
    btn = screen.getByRole('button', { name: /skip/i })
  } catch (e) {
    throw new TourKitTestingError('skipTour: no Skip button found', { cause: e })
  }
  await user.click(btn)
  await act(async () => {})
}
