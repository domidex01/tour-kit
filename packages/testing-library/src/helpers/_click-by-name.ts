import { act, screen } from '@testing-library/react'
import type userEvent from '@testing-library/user-event'
import { TourKitTestingError } from '../error'

type UserEvent = ReturnType<typeof userEvent.setup>

/**
 * Locate a button matching the given accessible-name pattern, click it, and
 * flush Floating UI microtasks. Throws `TourKitTestingError` (preserving the
 * RTL cause) when no matching button exists.
 *
 * Internal helper — keeps advance-tour / previous-tour / skip-tour from
 * re-deriving the same try/click/flush ritual.
 */
export async function clickButtonByName(
  user: UserEvent,
  pattern: RegExp,
  errorMessage: string
): Promise<void> {
  let btn: HTMLElement
  try {
    btn = screen.getByRole('button', { name: pattern })
  } catch (cause) {
    throw new TourKitTestingError(errorMessage, { cause })
  }
  await user.click(btn)
  await act(async () => {})
}
