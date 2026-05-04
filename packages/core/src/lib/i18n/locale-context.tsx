'use client'
import { type ReactNode, createContext, useContext, useMemo } from 'react'
import type { Messages, TranslateFn } from './use-t'

export interface LocaleContextValue {
  locale: string
  messages: Messages
  /** Optional consumer-side override — delegates t() to host app's i18n */
  t?: TranslateFn
  /** Auto-derived from locale; consumers can override */
  direction?: 'ltr' | 'rtl'
  /**
   * Optional user/template context merged into every interpolation. Keyed values
   * (e.g. `user.name`) are pulled from this object when a string template like
   * `'Hi {{user.name}}'` is rendered without explicit call-site vars.
   */
  userContext?: Record<string, unknown>
}

const LocaleContext = createContext<LocaleContextValue>({ locale: 'en', messages: {} })

export interface LocaleProviderProps extends Partial<LocaleContextValue> {
  children: ReactNode
}

export function LocaleProvider({
  locale = 'en',
  messages = {},
  t,
  direction,
  userContext,
  children,
}: LocaleProviderProps) {
  const value = useMemo(
    () => ({ locale, messages, t, direction: direction ?? deriveDir(locale), userContext }),
    [locale, messages, t, direction, userContext]
  )
  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>
}

export function useLocale(): LocaleContextValue {
  return useContext(LocaleContext)
}

const RTL = new Set(['ar', 'he', 'fa', 'ur'])
function deriveDir(locale: string): 'ltr' | 'rtl' {
  return RTL.has(locale.split('-')[0]) ? 'rtl' : 'ltr'
}
