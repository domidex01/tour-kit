import type { ScrollConfig } from '../types'
import { isElementVisible } from './dom'

const defaultScrollConfig: Required<ScrollConfig> = {
  enabled: true,
  behavior: 'smooth',
  block: 'center',
  offset: 20,
}

/**
 * Scroll element into view with configuration
 */
export function scrollIntoView(element: HTMLElement, config?: ScrollConfig): Promise<void> {
  const mergedConfig = { ...defaultScrollConfig, ...config }

  if (!mergedConfig.enabled) {
    return Promise.resolve()
  }

  return new Promise((resolve) => {
    if (isElementVisible(element)) {
      resolve()
      return
    }

    element.scrollIntoView({
      behavior: mergedConfig.behavior,
      block: mergedConfig.block,
    })

    // Estimate scroll duration
    const duration = mergedConfig.behavior === 'smooth' ? 500 : 0
    setTimeout(resolve, duration)
  })
}

/**
 * Scroll to specific position
 */
export function scrollTo(
  container: HTMLElement | Window,
  position: { top?: number; left?: number },
  behavior: ScrollBehavior = 'smooth'
): void {
  container.scrollTo({
    ...position,
    behavior,
  })
}

/**
 * Get current scroll position
 */
export function getScrollPosition(container: HTMLElement | Window = window): {
  x: number
  y: number
} {
  if (container === window) {
    return {
      x: window.scrollX || document.documentElement.scrollLeft,
      y: window.scrollY || document.documentElement.scrollTop,
    }
  }

  const el = container as HTMLElement
  return {
    x: el.scrollLeft,
    y: el.scrollTop,
  }
}

/**
 * Lock body scroll and return unlock function
 */
export function lockScroll(): () => void {
  const scrollY = window.scrollY
  const body = document.body

  body.style.position = 'fixed'
  body.style.top = `-${scrollY}px`
  body.style.width = '100%'
  body.style.overflowY = 'scroll'

  return () => {
    body.style.position = ''
    body.style.top = ''
    body.style.width = ''
    body.style.overflowY = ''
    window.scrollTo(0, scrollY)
  }
}
