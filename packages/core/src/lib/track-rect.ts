/** v2 §1.3b — RED STUB for `trackRect`. */
export interface RectTracker {
  update(): void
  stop(): void
}

export interface TrackRectOptions {
  observeResize?: boolean
}

export function trackRect(
  _element: HTMLElement,
  _onRect: (rect: DOMRect) => void,
  _options?: TrackRectOptions
): RectTracker {
  throw new Error('trackRect: not implemented')
}
