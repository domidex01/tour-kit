/**
 * v2 §1.3b — `use-broadcast.ts` as a plain factory.
 *
 * Already almost framework-free; the hook was a `useMemo` around `new
 * BroadcastChannel` plus a cleanup effect. `close()` replaces the effect.
 *
 * Self-message filtering stays the caller's job — attach a `tabId` and ignore
 * your own.
 */
export interface BroadcastStore<TMsg> {
  post: (msg: TMsg) => void
  /** @returns Unsubscribe. */
  subscribe: (handler: (msg: TMsg) => void) => () => void
  /** Terminal. Stops delivery and releases the channel. */
  close: () => void
}

export function createBroadcast<TMsg>(
  _channelName: string,
  _options?: { enabled?: boolean }
): BroadcastStore<TMsg> {
  throw new Error('createBroadcast: not implemented (v2 §1.3b)')
}
