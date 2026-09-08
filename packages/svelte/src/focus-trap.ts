/**
 * `createFocusTrap` as a Svelte **action** — `<div use:focusTrap={{ enabled }}>`.
 *
 * Two-phase, like the React and Vue wrappers: `capture()` records
 * `document.activeElement` as the return target, `activate()` moves focus into
 * the container. An action runs when the node exists, so both can happen in one
 * call — the ordering that matters (capture before the card steals focus) is
 * preserved because the action runs before anything inside it is focused.
 *
 * The trap is built ONCE and re-armed through `update`.
 *
 * `destroy` deactivates BEFORE releasing, and that is the deliberate part. For
 * an action, node destruction IS the card unmounting — and in React that is
 * exactly where `deactivate()` runs (`<TourCard>`'s effect returns
 * `() => deactivate()`), with `release()` following from the hook's own unmount
 * effect. A card that vanishes on `Escape` must hand focus back to whatever
 * opened it; `release()` alone is the no-restore teardown and would strand
 * focus on `<body>`.
 *
 * @module focus-trap
 */
import { type FocusTrapOptions, createFocusTrap } from '@tour-kit/core/engine'
import type { Action } from 'svelte/action'

export interface FocusTrapParams extends FocusTrapOptions {
  /** Default `true`. `false` deactivates and restores focus. */
  enabled?: boolean
}

export const focusTrap: Action<HTMLElement, FocusTrapParams | undefined> = (node, params) => {
  const trap = createFocusTrap(() => node, { inertBackground: params?.inertBackground ?? false })

  const apply = (next: FocusTrapParams | undefined) => {
    if (next?.enabled ?? true) {
      trap.capture()
      trap.activate()
    } else {
      trap.deactivate()
    }
  }

  apply(params)

  return {
    update: apply,
    destroy: () => {
      trap.deactivate()
      trap.release()
    },
  }
}
