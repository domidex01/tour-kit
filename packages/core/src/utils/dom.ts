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
 * Wait for element to appear in DOM
 */
export function waitForElement(selector: string, timeout = 5000): Promise<HTMLElement> {
  return new Promise((resolve, reject) => {
    const element = document.querySelector<HTMLElement>(selector)
    if (element) {
      resolve(element)
      return
    }

    let timeoutId: ReturnType<typeof setTimeout> | null = null
    let observer: MutationObserver | null = null

    const cleanup = () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
        timeoutId = null
      }
      if (observer) {
        observer.disconnect()
        observer = null
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
  })
}

const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'textarea:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(', ')

/**
 * Get all focusable elements within a container
 */
export function getFocusableElements(container: HTMLElement): HTMLElement[] {
  return Array.from(container.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
    (el) => el.offsetParent !== null
  )
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
