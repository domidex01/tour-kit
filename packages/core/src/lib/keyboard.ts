/**
 * v2 §1.3b — RED STUB for `attachKeyboard`.
 */
import type { KeyboardConfig } from '../types'

export interface KeyboardActions {
  next(): unknown
  prev(): unknown
  skip(): unknown
}

export interface AttachKeyboardOptions {
  /** Checked inside the handler, per event. Not a subscription. */
  isEnabled?: () => boolean
}

export function attachKeyboard(
  _actions: KeyboardActions,
  _config?: KeyboardConfig,
  _options?: AttachKeyboardOptions
): () => void {
  throw new Error('attachKeyboard: not implemented')
}
