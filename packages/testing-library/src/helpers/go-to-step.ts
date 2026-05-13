import { act } from '@testing-library/react'
import { TourKitTestingError } from '../error'
import { getActiveTourHandle } from './hook-probe'

/**
 * Jump the active tour to a specific step.
 *
 * Requires a `<HookProbe />` to be rendered inside the same `<TourProvider>` —
 * the probe captures `useTour()` so this helper can call `goToStep` without
 * reaching into globals. Phase 5 stays in-process; Phase 6 owns `window.__tourKit__`.
 */
export async function goToStep(stepId: string): Promise<void> {
  const handle = getActiveTourHandle()
  if (!handle) {
    throw new TourKitTestingError(
      'goToStep: no active <HookProbe /> mounted. Render <HookProbe /> inside <TourProvider> to use this helper.',
      { stepId }
    )
  }
  try {
    await act(async () => {
      await handle.goToStep(stepId)
    })
  } catch (e) {
    throw new TourKitTestingError(`goToStep: failed to navigate to step "${stepId}"`, {
      cause: e,
      stepId,
    })
  }
}
