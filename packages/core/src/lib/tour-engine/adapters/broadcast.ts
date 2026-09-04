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

const NOOP_STORE: BroadcastStore<unknown> = {
  post: () => {},
  subscribe: () => () => {},
  close: () => {},
}

export function createBroadcast<TMsg>(
  channelName: string,
  options?: { enabled?: boolean }
): BroadcastStore<TMsg> {
  const enabled = options?.enabled ?? true
  if (!enabled || typeof BroadcastChannel === 'undefined') {
    return NOOP_STORE as BroadcastStore<TMsg>
  }

  let channel: BroadcastChannel | null = new BroadcastChannel(channelName)

  return {
    post: (msg) => {
      channel?.postMessage(msg)
    },

    subscribe: (handler) => {
      const target = channel
      if (!target) return () => {}
      const wrapped = (e: MessageEvent) => handler(e.data as TMsg)
      target.addEventListener('message', wrapped)
      return () => target.removeEventListener('message', wrapped)
    },

    close: () => {
      channel?.close()
      channel = null
    },
  }
}
