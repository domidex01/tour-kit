'use client'

import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { ReactNode } from 'react'

interface DirectorContextValue {
  /** True when Director mode is revealed (the `~` toggle). */
  enabled: boolean
  toggle: () => void
  setEnabled: (v: boolean) => void
}

const DirectorContext = createContext<DirectorContextValue | null>(null)

const STORAGE_KEY = 'helm-director'

/**
 * Gates all dev-only chrome (Director panel, demo panel, license debug,
 * console analytics) behind a single `~` toggle so the dashboard records
 * clean by default. Hidden unless explicitly revealed.
 */
export function DirectorProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false)

  // Restore last toggle state (handy across hot reloads + after Reset-all
  // reload). Done in an effect — not a lazy initializer — so SSR and the first
  // client render agree (both start `false`), avoiding a hydration mismatch
  // when the panel would otherwise appear only on the client.
  useEffect(() => {
    try {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional post-mount restore; see above
      setEnabled(window.localStorage.getItem(STORAGE_KEY) === '1')
    } catch {}
  }, [])

  const persist = useCallback((v: boolean) => {
    try {
      window.localStorage.setItem(STORAGE_KEY, v ? '1' : '0')
    } catch {}
  }, [])

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      const next = !prev
      persist(next)
      return next
    })
  }, [persist])

  // Keyboard controls:
  //  • `~` / backtick — toggle the Director panel (show ⇄ hide)
  //  • Escape         — hide the panel, but only once nothing else is open
  //                     (an active tour card / survey / dialog gets the first
  //                     Escape to close itself; a second Escape hides Director)
  // All ignored while typing in a field.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement | null
      const tag = el?.tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || el?.isContentEditable) return

      if (e.key === '`' || e.key === '~') {
        e.preventDefault()
        toggle()
        return
      }

      if (e.key === 'Escape' && enabled) {
        const overlayOpen = document.querySelector(
          '[role="dialog"], [data-survey-slideout], [data-survey-popover], [data-tour-step]'
        )
        if (overlayOpen) return // let Escape close the open overlay first
        setEnabled(false)
        persist(false)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [toggle, enabled, persist])

  return (
    <DirectorContext.Provider
      value={{
        enabled,
        toggle,
        setEnabled: (v) => {
          setEnabled(v)
          persist(v)
        },
      }}
    >
      {children}
    </DirectorContext.Provider>
  )
}

export function useDirector(): DirectorContextValue {
  const ctx = useContext(DirectorContext)
  if (!ctx) {
    // Safe default so dev chrome that reads this outside the provider just hides.
    return { enabled: false, toggle: () => {}, setEnabled: () => {} }
  }
  return ctx
}
