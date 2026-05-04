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
  children,
}: LocaleProviderProps) {
  const value = useMemo(
    () => ({ locale, messages, t, direction: direction ?? deriveDir(locale) }),
    [locale, messages, t, direction]
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
