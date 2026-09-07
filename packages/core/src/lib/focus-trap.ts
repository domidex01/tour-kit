/**
 * v2 §1.3b — `use-focus-trap.ts`'s body as a plain, React-free factory.
 *
 * **Two phases, deliberately.** Both `TourCard` (`TourPortal`) and
 * `SurveyPopover` (`FloatingPortal`) mount their node AFTER the render in
 * which the trap becomes enabled, so by the time a consumer can call
 * `activate()` the trigger is no longer `document.activeElement` — focus has
 * drifted to `<body>`. `capture()` records the return target the moment the
 * trap is enabled; `activate()` engages once the node exists. The container is
 * a getter for the same reason: it arrives late.
 *
 * @module focus-trap
 */
import { getFocusableElements } from '../utils/dom'

export interface FocusTrapOptions {
  /**
   * When `true`, sibling content outside the trapped container is marked
   * `inert` + `aria-hidden="true"` while the trap is active, giving true modal
   * semantics (`aria-modal="true"`). The subtree containing the trapped
   * container (e.g. its portal root) is left interactive. Attributes are
   * restored to their previous values on `deactivate()` / `release()`.
   *
   * Default: `false` (focus is trapped, but the background stays perceivable —
   * appropriate for non-modal dialogs).
   */
  inertBackground?: boolean
}

export interface FocusTrap {
  /**
   * Record `document.activeElement` as the return target, once. Call when the
   * trap becomes enabled — before any portal mounts.
   */
  capture(): void
  /**
   * Drop the recorded target without restoring focus. For enabled → false with
   * no `activate()` in between. A no-op while trapping.
   */
  forget(): void
  /**
   * Focus the first focusable (or the container), install the Tab handler,
   * inert the background. Idempotent; bails when the getter returns `null`.
   */
  activate(): void
  /** Remove the handler, restore inert, restore focus to the captured element. */
  deactivate(): void
  /**
   * Teardown without focus restore — the unmount path. Idempotent, and
   * re-armable: a later `activate()` engages the trap again.
   */
  release(): void
}

/**
 * Module-level ref-count of the `inert` + `aria-hidden` applied to background
 * elements. Concurrent/nested inert-background traps may touch the same element;
 * each records the ORIGINAL (pre-any-trap) state once and increments a count,
 * and the original is only restored when the last trap releases. Without this,
 * the later trap's restore could re-apply `aria-hidden` after the first removed
 * it, stranding the background hidden from assistive tech.
 */
interface InertRecord {
  count: number
  originalInert: boolean
  originalAriaHidden: string | null
}
const inertRegistry = new WeakMap<HTMLElement, InertRecord>()

/**
 * Marks every direct child of `document.body` that does not contain `container`
 * as `inert` + `aria-hidden`, returning a function that releases this trap's
 * hold (restoring the original state once no trap needs the element hidden).
 * `container` is typically inside a portal appended to `body`, so its own portal
 * root is skipped and stays interactive.
 */
function applyBackgroundInert(container: HTMLElement): () => void {
  if (typeof document === 'undefined' || !document.body) return () => {}

  const affected: HTMLElement[] = []

  for (const child of Array.from(document.body.children)) {
    if (!(child instanceof HTMLElement)) continue
    // Leave the subtree that owns the trapped container interactive.
    if (child === container || child.contains(container)) continue

    affected.push(child)
    const existing = inertRegistry.get(child)
    if (existing) {
      existing.count += 1
    } else {
      inertRegistry.set(child, {
        count: 1,
        originalInert: child.hasAttribute('inert'),
        originalAriaHidden: child.getAttribute('aria-hidden'),
      })
      child.setAttribute('inert', '')
      child.setAttribute('aria-hidden', 'true')
    }
  }

  return () => {
    for (const el of affected) {
      const record = inertRegistry.get(el)
      if (!record) continue
      record.count -= 1
      if (record.count > 0) continue
      // Last trap released — restore the original (pre-trap) state.
      inertRegistry.delete(el)
      if (!record.originalInert) el.removeAttribute('inert')
      if (record.originalAriaHidden === null) {
        el.removeAttribute('aria-hidden')
      } else {
        el.setAttribute('aria-hidden', record.originalAriaHidden)
      }
    }
  }
}

/** Every method is a no-op on the server; a `useMemo` may build one there. */
const NOOP_TRAP: FocusTrap = {
  capture: () => {},
  forget: () => {},
  activate: () => {},
  deactivate: () => {},
  release: () => {},
}

export function createFocusTrap(
  getContainer: () => HTMLElement | null,
  options: FocusTrapOptions = {}
): FocusTrap {
  if (typeof document === 'undefined') return NOOP_TRAP

  const { inertBackground = false } = options

  // Closure variables where the hook had refs.
  let previousActiveElement: HTMLElement | null = null
  let isTrapping = false
  let restoreInert: (() => void) | null = null

  const handleKeyDown = (event: KeyboardEvent): void => {
    const container = getContainer()
    if (!isTrapping || event.key !== 'Tab' || !container) return

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
  }

  const capture = (): void => {
    if (previousActiveElement) return
    const active = document.activeElement as HTMLElement | null
    if (active && active !== document.body) previousActiveElement = active
  }

  /** Drop the handler + inert hold. Shared by `deactivate()` and `release()`. */
  const teardown = (): void => {
    document.removeEventListener('keydown', handleKeyDown)
    restoreInert?.()
    restoreInert = null
  }

  return {
    capture,

    forget: () => {
      // Enabled→false without a deactivate() (e.g. the trap was enabled but its
      // consumer never activated because a lazy portal never mounted). Clear the
      // captured element so the next enable re-captures the correct trigger
      // instead of restoring focus to a stale one.
      if (!isTrapping) previousActiveElement = null
    },

    activate: () => {
      const container = getContainer()
      if (!container) return
      // Idempotent: don't re-capture the previously-focused element if already
      // trapping (e.g. an effect firing twice under React Strict Mode).
      if (isTrapping) return

      // Prefer the element captured when the trap was enabled. Falling back to
      // `document.activeElement` here is a last resort — by the time activate()
      // runs (often several renders later, once a lazy portal has mounted),
      // focus may already have drifted to <body>.
      capture()
      isTrapping = true

      if (inertBackground) restoreInert = applyBackgroundInert(container)

      const focusable = getFocusableElements(container)
      if (focusable.length > 0) {
        focusable[0].focus()
      } else {
        container.focus?.()
      }

      document.addEventListener('keydown', handleKeyDown)
    },

    deactivate: () => {
      teardown()

      if (isTrapping && previousActiveElement) previousActiveElement.focus()
      previousActiveElement = null
      isTrapping = false
    },

    release: () => {
      teardown()
      // Reset the flag, or `activate()` bails on its idempotence guard and
      // the trap is silently dead. Harmless while this was a hook (unmount
      // threw the closure away); not harmless now that a binding drives
      // release/re-activate cycles through `/engine`.
      isTrapping = false
    },
  }
}
