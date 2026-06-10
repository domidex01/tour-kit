import { throttleLeading } from '@tour-kit/core'
import type { Feature } from '../types'

type UsageCallback = (featureId: string) => void

// One native event must count as ONE usage per feature, no matter how many
// tracking paths see it. A `<FeatureButton>` whose DOM node also matches the
// feature's `trigger` selector is hit by BOTH the capture-phase selector
// listener below and the button's own onClick trackUsage — without claiming,
// a single click double-counts.
const claimedEvents = new WeakMap<Event, Set<string>>()

/**
 * Claim `event` for `featureId`. Returns `true` for the first claimant —
 * later tracking paths seeing the same native event must skip.
 */
export function claimUsageEvent(event: Event, featureId: string): boolean {
  let claimed = claimedEvents.get(event)
  if (!claimed) {
    claimed = new Set()
    claimedEvents.set(event, claimed)
  }
  if (claimed.has(featureId)) return false
  claimed.add(featureId)
  return true
}

/**
 * Set up tracking for a feature's trigger
 */
export function setupFeatureTracking(feature: Feature, onUsage: UsageCallback): () => void {
  const { trigger } = feature

  // CSS selector trigger - track clicks
  if (typeof trigger === 'string') {
    return setupClickTracking(trigger, feature.id, () => onUsage(feature.id))
  }

  // Custom event trigger
  if ('event' in trigger) {
    return setupEventTracking(trigger.event, () => onUsage(feature.id))
  }

  // Callback trigger - no automatic tracking
  // User must call trackUsage manually
  return () => {}
}

/**
 * Track clicks on elements matching selector
 * Uses leading-edge throttle (1s) to prevent rapid-fire events
 */
function setupClickTracking(selector: string, featureId: string, callback: () => void): () => void {
  // Throttle to prevent rapid-fire feature_used events
  const throttledCallback = throttleLeading(callback, 1000)

  const handler = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.matches(selector) || target.closest(selector)) {
      // Capture phase runs before React's bubble-phase onClick, so this
      // listener claims first and a FeatureButton on the same node skips.
      if (!claimUsageEvent(event, featureId)) return
      throttledCallback()
    }
  }

  document.addEventListener('click', handler, { capture: true })
  return () => {
    throttledCallback.cancel()
    document.removeEventListener('click', handler, { capture: true })
  }
}

/**
 * Track custom events
 */
function setupEventTracking(eventName: string, callback: () => void): () => void {
  const handler = () => callback()

  window.addEventListener(eventName, handler)
  return () => window.removeEventListener(eventName, handler)
}

/**
 * Emit a custom feature event
 */
export function emitFeatureEvent(eventName: string, detail?: unknown): void {
  window.dispatchEvent(new CustomEvent(eventName, { detail }))
}
