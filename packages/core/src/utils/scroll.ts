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
 * Symbol used to attach a shared lock state to `document.body`, so nested
 * `lockScroll()` calls (e.g. tour card opens a modal that also locks scroll)
 * share a single lock instead of each reading `scrollY === 0` once the body
 * is already fixed.
 */
const LOCK_KEY = Symbol.for('tourkit.scroll-lock')

interface LockState {
  depth: number
  scrollY: number
  prev: {
    position: string
    top: string
    width: string
    overflowY: string
  }
}

type BodyWithLock = HTMLElement & { [LOCK_KEY]?: LockState }

/**
 * Lock body scroll and return unlock function.
 *
 * Ref-counted: nested calls share a single lock. The saved scroll position
 * is captured once (on the outermost call) and restored once (when the
 * outermost unlock runs).
 */
export function lockScroll(): () => void {
  const body = document.body as BodyWithLock

  if (!body[LOCK_KEY]) {
    body[LOCK_KEY] = {
      depth: 0,
      scrollY: window.scrollY,
      prev: {
        position: body.style.position,
        top: body.style.top,
        width: body.style.width,
        overflowY: body.style.overflowY,
      },
    }
    body.style.position = 'fixed'
    body.style.top = `-${body[LOCK_KEY].scrollY}px`
    body.style.width = '100%'
    body.style.overflowY = 'scroll'
  }
  body[LOCK_KEY].depth += 1

  let released = false
  return () => {
    if (released) return
    released = true
    const state = body[LOCK_KEY]
    if (!state) return
    state.depth -= 1
    if (state.depth === 0) {
      body.style.position = state.prev.position
      body.style.top = state.prev.top
      body.style.width = state.prev.width
      body.style.overflowY = state.prev.overflowY
      window.scrollTo(0, state.scrollY)
      delete body[LOCK_KEY]
    }
  }
}
