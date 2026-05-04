import { useCallback } from 'react'
import { interpolate } from '../interpolate'
import { useLocale } from './locale-context'

export type Messages = Record<string, string>
export type TranslateFn = (key: string, vars?: Record<string, unknown>) => string

export function useT(): TranslateFn {
  const { locale, messages } = useLocale()
  return useCallback(
    (key, vars) => {
      const template = messages[key] ?? key
      return interpolate(template, vars, { warnOnMissing: false })
    },
    [locale, messages]
  )
}
