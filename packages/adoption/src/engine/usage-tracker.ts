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
 */
function setupClickTracking(selector: string, callback: () => void): () => void {
  const handler = (event: MouseEvent) => {
    const target = event.target as Element
    if (target.matches(selector) || target.closest(selector)) {
      callback()
    }
  }

  document.addEventListener('click', handler, { capture: true })
  return () => document.removeEventListener('click', handler, { capture: true })
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
