import * as React from 'react'

export interface UseBroadcastReturn<TMsg> {
  /** Post a message to all other tabs subscribing to the same channel name. */
  post: (msg: TMsg) => void
  /**
   * Subscribe to messages on the channel.
   * @returns Cleanup function — call on unmount to remove the listener.
   */
  subscribe: (handler: (msg: TMsg) => void) => () => void
}

const NOOP_RETURN: UseBroadcastReturn<unknown> = {
  post: () => {},
  subscribe: () => () => {},
}

/**
 * Typed wrapper around `BroadcastChannel` for cross-tab pub/sub.
 *
 * Lazy-initializes the channel and closes it on unmount. When the runtime
 * does not provide `BroadcastChannel` (e.g. older Safari) or when
 * `options.enabled === false`, both `post` and `subscribe` are no-ops so
 * consumers do not need to branch.
 *
 * Self-message filtering is the consumer's responsibility — attach a
 * `tabId` to your messages and ignore matching ones.
 *
 * @typeParam TMsg - Discriminated union of message shapes for this channel.
 */
export function useBroadcast<TMsg>(
  channelName: string,
  options?: { enabled?: boolean }
): UseBroadcastReturn<TMsg> {
  const enabled = options?.enabled ?? true
  const isAvailable = typeof BroadcastChannel !== 'undefined'

  const channel = React.useMemo(() => {
    if (!enabled || !isAvailable) return null
    return new BroadcastChannel(channelName)
  }, [enabled, isAvailable, channelName])

  React.useEffect(() => {
    return () => channel?.close()
  }, [channel])

  const post = React.useCallback(
    (msg: TMsg) => {
      channel?.postMessage(msg)
    },
    [channel]
  )

  const subscribe = React.useCallback(
    (handler: (msg: TMsg) => void) => {
      if (!channel) return () => {}
      const wrapped = (e: MessageEvent) => handler(e.data as TMsg)
      channel.addEventListener('message', wrapped)
      return () => channel.removeEventListener('message', wrapped)
    },
    [channel]
  )

  // Memoize return value so consumers can safely use the hook result in
  // effect dep arrays without re-running on every render.
  const value = React.useMemo<UseBroadcastReturn<TMsg>>(
    () => ({ post, subscribe }),
    [post, subscribe]
  )

  if (!enabled || !isAvailable) {
    return NOOP_RETURN as UseBroadcastReturn<TMsg>
  }

  return value
}
