import { useCallback } from 'react'
import { interpolate } from '../interpolate'
import { useLocale } from './locale-context'
import { resolvePlural } from './plural'

export type Messages = Record<string, string>
export type TranslateFn = (key: string, vars?: Record<string, unknown>) => string

/**
 * Hook returning a translator function `t(key, vars?)` that:
 *
 *   1. Delegates to `LocaleContextValue.t` when a consumer adapter is supplied
 *      (host i18n libraries like next-intl take precedence over the built-in path).
 *   2. Looks up `messages[key]`. Falls back to the key itself in dev (visible
 *      breadcrumb) and to an empty string in production.
 *   3. Resolves any `{count, plural, …}` block via `Intl.PluralRules`.
 *   4. Substitutes `{{var}}` tokens via `interpolate`.
 */
export function useT(): TranslateFn {
  const { locale, messages, t: adapter } = useLocale()
  return useCallback<TranslateFn>(
    (key, vars) => {
      if (adapter) return adapter(key, vars)
      const template = messages[key]
      if (template === undefined) {
        return process.env.NODE_ENV !== 'production' ? key : ''
      }
      const resolved = resolvePlural(template, locale, vars)
      return interpolate(resolved, vars, { warnOnMissing: false })
    },
    [adapter, locale, messages]
  )
}
