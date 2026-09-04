import * as React from 'react'
import { type BroadcastStore, createBroadcast } from '../lib/tour-engine/adapters/broadcast'

export interface UseBroadcastReturn<TMsg> {
  /** Post a message to all other tabs subscribing to the same channel name. */
  post: (msg: TMsg) => void
  /**
   * Subscribe to messages on the channel.
   * @returns Cleanup function — call on unmount to remove the listener.
   */
  subscribe: (handler: (msg: TMsg) => void) => () => void
}

/**
 * React wrapper over `createBroadcast` (v2 §1.3b).
 *
 * Typed wrapper around `BroadcastChannel` for cross-tab pub/sub. The factory
 * lazily opens the channel and no-ops when the runtime lacks
 * `BroadcastChannel` (e.g. older Safari) or when `options.enabled === false`,
 * so consumers do not need to branch. All that stays here is closing the
 * channel on unmount.
 *
 * Self-message filtering is the consumer's responsibility — attach a `tabId`
 * to your messages and ignore matching ones.
 *
 * @typeParam TMsg - Discriminated union of message shapes for this channel.
 */
export function useBroadcast<TMsg>(
  channelName: string,
  options?: { enabled?: boolean }
): UseBroadcastReturn<TMsg> {
  const enabled = options?.enabled ?? true

  const store = React.useMemo<BroadcastStore<TMsg>>(
    () => createBroadcast<TMsg>(channelName, { enabled }),
    [channelName, enabled]
  )

  React.useEffect(() => () => store.close(), [store])

  // Memoized so consumers can put the result in effect dep arrays without
  // re-running every render.
  return React.useMemo(() => ({ post: store.post, subscribe: store.subscribe }), [store])
}
