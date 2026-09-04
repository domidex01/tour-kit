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
  // `typeof BroadcastChannel === 'undefined'` is NOT enough on its own: Node
  // 18+ ships a global BroadcastChannel, and an open channel refs the event
  // loop, so a server-side `createTourEngine()` would construct a live channel
  // and hang the process until `destroy()` — which SSR never calls. The
  // `window` check is what makes the constructor genuinely inert off-browser.
  const canBroadcast = typeof window !== 'undefined' && typeof BroadcastChannel !== 'undefined'
  if (!enabled || !canBroadcast) {
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
