/**
 * v2 §1.3b — `use-keyboard.ts`'s body as a plain, React-free function.
 *
 * **Gating is a predicate, not a subscription** (§1.3b Decision 2), because
 * nothing here has to be rebuilt when the tour changes: the listener sits on
 * `document` and the three actions are stable, so knowing whether a tour is
 * live is the only per-event question. `isEnabled?.()` answers it inside the
 * handler — a binding attaches once at mount and passes
 * `() => engine.getState().isActive`. Contrast `attachAdvanceOn`, which DOES
 * subscribe: its listener hangs off the current step's target element, so a
 * step change forces a genuine rebind and there is nothing a predicate could
 * do about it.
 *
 * The React wrapper uses neither, because an effect keyed on `isActive`
 * already detaches while the tour is idle.
 *
 * @module keyboard
 */
import type { KeyboardConfig } from '../types'
import { defaultKeyboardConfig } from '../types/config'

export interface KeyboardActions {
  next(): unknown
  prev(): unknown
  skip(): unknown
}

export interface AttachKeyboardOptions {
  /** Evaluated inside every keydown. Returning `false` suppresses the event. */
  isEnabled?: () => boolean
}

/** Typing in a field must never advance the tour. */
function isEditable(el: HTMLElement | null): boolean {
  return (
    el instanceof HTMLInputElement ||
    el instanceof HTMLTextAreaElement ||
    el instanceof HTMLSelectElement ||
    !!el?.isContentEditable ||
    el?.getAttribute('role') === 'textbox'
  )
}

const noop = () => {}

/**
 * Wire arrow/exit keys on `document` to three actions.
 *
 * @returns Detach. Idempotent.
 */
export function attachKeyboard(
  actions: KeyboardActions,
  config?: KeyboardConfig,
  options?: AttachKeyboardOptions
): () => void {
  const merged = { ...defaultKeyboardConfig, ...config }
  if (!merged.enabled || typeof document === 'undefined') return noop

  const handleKeyDown = (event: KeyboardEvent): void => {
    if (options?.isEnabled && !options.isEnabled()) return

    if (isEditable(document.activeElement as HTMLElement | null)) return

    const { key } = event
    if (merged.nextKeys?.includes(key)) {
      event.preventDefault()
      actions.next()
    } else if (merged.prevKeys?.includes(key)) {
      event.preventDefault()
      actions.prev()
    } else if (merged.exitKeys?.includes(key)) {
      event.preventDefault()
      actions.skip()
    }
  }

  document.addEventListener('keydown', handleKeyDown)
  return () => document.removeEventListener('keydown', handleKeyDown)
}
