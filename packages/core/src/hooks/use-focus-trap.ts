import { useCallback, useEffect, useRef } from 'react'
import { getFocusableElements } from '../utils/dom'

export interface UseFocusTrapOptions {
  /**
   * When `true`, sibling content outside the trapped container is marked
   * `inert` + `aria-hidden="true"` while the trap is active, giving true modal
   * semantics (`aria-modal="true"`). The subtree containing the trapped
   * container (e.g. its portal root) is left interactive. Attributes are
   * restored to their previous values on deactivate/unmount.
   *
   * Default: `false` (focus is trapped, but the background stays perceivable —
   * appropriate for non-modal dialogs).
   */
  inertBackground?: boolean
}

export interface UseFocusTrapReturn {
  containerRef: React.RefObject<HTMLElement | null>
  activate: () => void
  deactivate: () => void
}

/**
 * Marks every direct child of `document.body` that does not contain `container`
 * as `inert` + `aria-hidden`, returning a function that restores the previous
 * state. `container` is typically inside a portal appended to `body`, so its
 * own portal root is skipped and stays interactive.
 */
function applyBackgroundInert(container: HTMLElement): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {}

  const modified: Array<{
    el: HTMLElement
    hadInert: boolean
    prevAriaHidden: string | null
  }> = []

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue
    // Leave the subtree that owns the trapped container interactive.
    if (child === container || child.contains(container)) continue

    modified.push({
      el: child,
      hadInert: child.hasAttribute('inert'),
      prevAriaHidden: child.getAttribute('aria-hidden'),
    })
    child.setAttribute('inert', '')
    child.setAttribute('aria-hidden', 'true')
  }

  return () => {
    for (const { el, hadInert, prevAriaHidden } of modified) {
      if (!hadInert) el.removeAttribute('inert')
      if (prevAriaHidden === null) {
        el.removeAttribute('aria-hidden')
      } else {
        el.setAttribute('aria-hidden', prevAriaHidden)
      }
    }
  }
}

export function useFocusTrap(enabled = true, options: UseFocusTrapOptions = {}): UseFocusTrapReturn {
  const { inertBackground = false } = options

  const containerRef = useRef<HTMLElement | null>(null)
  const previousActiveElement = useRef<HTMLElement | null>(null)
  const isTrapping = useRef(false)
  const restoreInert = useRef<(() => void) | null>(null)

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!isTrapping.current || event.key !== 'Tab' || !containerRef.current) {
      return
    }

    const container = containerRef.current
    const focusable = getFocusableElements(container)

    if (focusable.length === 0) {
      // Nothing focusable inside — keep focus on the container itself rather
      // than letting Tab escape to the background.
      event.preventDefault()
      container.focus()
      return
    }

    const first = focusable[0]
    const last = focusable[focusable.length - 1]
    const active = document.activeElement

    // If focus has drifted outside the container, pull it back in. Guards the
    // case where focus is on neither the first nor last focusable (so the
    // boundary checks below would miss it) yet has left the dialog.
    if (!(active instanceof Node) || !container.contains(active)) {
      event.preventDefault()
      first.focus()
      return
    }

    if (event.shiftKey && active === first) {
      event.preventDefault()
      last.focus()
    } else if (!event.shiftKey && active === last) {
      event.preventDefault()
      first.focus()
    }
  }, [])

  const activate = useCallback(() => {
    if (!enabled || !containerRef.current) return
    // Idempotent: don't re-capture the previously-focused element if already
    // trapping (e.g. an effect firing twice under React Strict Mode).
    if (isTrapping.current) return

    // Prefer the element captured when the trap was enabled (see effect below).
    // Falling back to `document.activeElement` here is a last resort — by the
    // time activate() runs (often several renders later, once a lazy portal has
    // mounted), focus may already have drifted to <body>.
    if (!previousActiveElement.current) {
      const active = document.activeElement as HTMLElement | null
      if (active && active !== document.body) {
        previousActiveElement.current = active
      }
    }
    isTrapping.current = true

    if (inertBackground) {
      restoreInert.current = applyBackgroundInert(containerRef.current)
    }

    const focusable = getFocusableElements(containerRef.current)
    if (focusable.length > 0) {
      focusable[0].focus()
    } else {
      containerRef.current.focus?.()
    }

    document.addEventListener('keydown', handleKeyDown)
  }, [enabled, inertBackground, handleKeyDown])

  const deactivate = useCallback(() => {
    document.removeEventListener('keydown', handleKeyDown)

    restoreInert.current?.()
    restoreInert.current = null

    if (isTrapping.current && previousActiveElement.current) {
      previousActiveElement.current.focus()
    }
    previousActiveElement.current = null
    isTrapping.current = false
  }, [handleKeyDown])

  // Capture the element to restore focus to as soon as the trap becomes
  // enabled — before the portal mounts or `inert`/focus moves shift
  // `document.activeElement` to <body>. activate() can run several renders
  // later (once a lazy portal node exists), by which point the trigger is no
  // longer the active element. Capturing here makes focus restoration reliable.
  useEffect(() => {
    if (!enabled) {
      // Enabled→false without a deactivate() (e.g. the trap was enabled but its
      // consumer never activated because a lazy portal never mounted). Clear the
      // captured element so the next enable re-captures the correct trigger
      // instead of restoring focus to a stale one.
      if (!isTrapping.current) previousActiveElement.current = null
      return
    }
    if (previousActiveElement.current) return
    const active = document.activeElement as HTMLElement | null
    if (active && active !== document.body) {
      previousActiveElement.current = active
    }
  }, [enabled])

  useEffect(() => {
    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      restoreInert.current?.()
      restoreInert.current = null
    }
  }, [handleKeyDown])

  return { containerRef, activate, deactivate }
}
