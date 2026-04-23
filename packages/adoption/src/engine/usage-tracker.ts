import { throttleLeading } from '@tour-kit/core'
import type { Feature } from '../types'

type UsageCallback = (featureId: string) => void

/**
 * Set up tracking for a feature's trigger
 */
export function setupFeatureTracking(feature: Feature, onUsage: UsageCallback): () => void {
  const { trigger } = feature

  // CSS selector trigger - track clicks
  if (typeof trigger === 'string') {
    return setupClickTracking(trigger, () => onUsage(feature.id))
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
function setupClickTracking(selector: string, callback: () => void): () => void {
  // Throttle to prevent rapid-fire feature_used events
  const throttledCallback = throttleLeading(callback, 1000)

  const handler = (event: MouseEvent) => {
    const target = event.target
    if (!(target instanceof Element)) return
    if (target.matches(selector) || target.closest(selector)) {
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
