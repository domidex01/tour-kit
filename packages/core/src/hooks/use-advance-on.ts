import { useContext, useEffect, useRef } from 'react'
import { TourContext } from '../context/tour-context'
import { getElement } from '../utils/dom'

export interface UseAdvanceOnOptions {
  /** Enable/disable the advanceOn behavior (default: true) */
  enabled?: boolean
}

/**
 * Hook to handle advanceOn behavior - automatically advances tour when
 * user performs specified action on target element
 */
export function useAdvanceOn(options: UseAdvanceOnOptions = {}): void {
  const { enabled = true } = options
  const context = useContext(TourContext)
  const cleanupRef = useRef<(() => void) | null>(null)

  if (!context) {
    throw new Error('useAdvanceOn must be used within a TourProvider')
  }

  const { isActive, currentStep, next } = context

  useEffect(() => {
    // Clean up previous listeners
    if (cleanupRef.current) {
      cleanupRef.current()
      cleanupRef.current = null
    }

    if (!enabled || !isActive || !currentStep?.advanceOn) {
      return
    }

    const { event, selector, handler } = currentStep.advanceOn

    // Get target element (defaults to document)
    const targetElement: Element | Document = selector
      ? getElement(selector) ?? document
      : document

    if (selector && targetElement === document) {
      console.warn(
        `[tour-kit] advanceOn: Element "${selector}" not found for step "${currentStep.id}"`
      )
    }

    // Debounce flag to prevent multiple rapid advances
    let isAdvancing = false

    const handleEvent = () => {
      if (isAdvancing) return

      // If handler is provided, it must return true to advance
      if (handler) {
        try {
          const shouldAdvance = handler()
          if (!shouldAdvance) return
        } catch (error) {
          console.warn(
            `[tour-kit] advanceOn handler error for step "${currentStep.id}":`,
            error
          )
          return
        }
      }

      isAdvancing = true
      next()

      // Reset after a short delay to handle race conditions
      setTimeout(() => {
        isAdvancing = false
      }, 100)
    }

    // Map event types to actual DOM events
    const eventMap: Record<string, string> = {
      click: 'click',
      input: 'input',
      custom: 'tourkit:advance', // Custom event for programmatic advance
    }

    const domEvent = eventMap[event] || event

    targetElement.addEventListener(domEvent, handleEvent)

    cleanupRef.current = () => {
      targetElement.removeEventListener(domEvent, handleEvent)
    }

    return () => {
      if (cleanupRef.current) {
        cleanupRef.current()
        cleanupRef.current = null
      }
    }
  }, [enabled, isActive, currentStep, next])
}

/**
 * Dispatch a custom advance event (for 'custom' event type)
 * This allows programmatic advancement when the step has advanceOn: { event: 'custom' }
 *
 * @param selector - Optional CSS selector for the target element (defaults to document)
 */
export function dispatchAdvanceEvent(selector?: string): void {
  const target = selector ? getElement(selector) : document
  if (target) {
    target.dispatchEvent(new CustomEvent('tourkit:advance', { bubbles: true }))
  }
}
