import type { TranslateFn } from '@tour-kit/core'

/**
 * `useT()` returns the key (dev) or `''` (prod) when a message is missing
 * from the active `LocaleProvider`. Substitute the supplied English fallback
 * in either case so the changelog UI reads naturally without a provider
 * mounted.
 */
export function tFallback(t: TranslateFn, key: string, fallback: string): string {
  const value = t(key)
  return value === '' || value === key ? fallback : value
}
