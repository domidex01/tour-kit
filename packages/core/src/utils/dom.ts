import type React from 'react'

/**
 * Safely get an element from various target types
 */
export function getElement(
  target: string | HTMLElement | React.RefObject<HTMLElement | null> | null
): HTMLElement | null {
  if (!target) return null

  if (typeof target === 'string') {
    return document.querySelector<HTMLElement>(target)
  }

  if ('current' in target) {
    return target.current
  }

  return target
}

/**
 * Check if element is fully visible in viewport
 */
export function isElementVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  return rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth
}

/**
 * Check if element is at least partially visible
 */
export function isElementPartiallyVisible(element: HTMLElement): boolean {
  const rect = element.getBoundingClientRect()
  const windowHeight = window.innerHeight || document.documentElement.clientHeight
  const windowWidth = window.innerWidth || document.documentElement.clientWidth

  return rect.top < windowHeight && rect.bottom > 0 && rect.left < windowWidth && rect.right > 0
}

/**
 * Wait for element to appear in DOM.
 *
 * @param selector - CSS selector to query against `document`
 * @param timeout - Reject after this many ms (default 5000)
 * @param signal - Optional `AbortSignal`. When aborted, the observer is
 *   disconnected and the promise rejects with `Error('aborted')`. If the
 *   signal is already aborted when called, rejects synchronously without
 *   ever attaching the observer.
 */
export function waitForElement(
  selector: string,
  timeout = 5000,
  signal?: AbortSignal
): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new Error('aborted'))
      return
    }

    const element = document.querySelector<HTMLElement>(selector)
    if (element) {
      resolve(element)
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null
    let onAbort: (() => void) | null = null

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (observer) {
        observer.disconnect()
        observer = null
      }
      if (onAbort && signal) {
        signal.removeEventListener('abort', onAbort)
        onAbort = null
      }
    }

    observer = new MutationObserver(() => {
      const el = document.querySelector<HTMLElement>(selector)
      if (el) {
        cleanup()
        resolve(el)
      }
    })

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    })

    timeoutId = setTimeout(() => {
      cleanup()
      reject(new Error(`Element "${selector}" not found within ${timeout}ms`))
    }, timeout)

    if (signal) {
      onAbort = () => {
        cleanup()
        reject(new Error('aborted'))
      }
      signal.addEventListener('abort', onAbort, { once: true })
    }
  })
}

const FOCUSABLE_SELECTOR = [
  'a[href]:not([tabindex="-1"])',
  'button:not([disabled]):not([tabindex="-1"])',
  'textarea:not([disabled]):not([tabindex="-1"])',
  'input:not([disabled]):not([tabindex="-1"])',
  'select:not([disabled]):not([tabindex="-1"])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Get all focusable elements within a container
 *
 * Uses getComputedStyle rather than offsetParent so `position: fixed`
 * descendants (which have a null offsetParent) are still included.
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter((el) => {
    const style = getComputedStyle(el)
    return style.display !== 'none' && style.visibility !== 'hidden'
  })
}

/**
 * Find the scrollable parent of an element
 */
export function getScrollParent(element: HTMLElement): HTMLElement | Window {
  let parent: HTMLElement | null = element.parentElement

  while (parent) {
    const { overflow, overflowX, overflowY } = getComputedStyle(parent)

    if (/(auto|scroll)/.test(overflow + overflowX + overflowY)) {
      return parent
    }

    parent = parent.parentElement
  }

  return window
}
