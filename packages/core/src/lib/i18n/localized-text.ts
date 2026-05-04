import { useCallback } from 'react'
import { interpolate } from '../interpolate'
import { useSegmentationContext } from '../segmentation/segmentation-context'
import { useLocale } from './locale-context'
import { useT } from './use-t'

/**
 * Discriminated text shape used by all UI packages for localizable copy.
 *
 * - `string` — rendered as-is, with `{{var}}` tokens interpolated against the
 *   resolved user context (graceful default-fallback when no provider is
 *   mounted).
 * - `{ key: string }` — looked up via `useT()` against `messages[key]`.
 */
export type LocalizedText = string | { key: string }

/**
 * Returns a memoized resolver `(value) => string` that takes a `LocalizedText`
 * (or `undefined`) and returns the rendered string. Intended for use inside
 * any component that surfaces consumer-authored copy:
 *
 *   const resolveText = useResolveLocalizedText()
 *   const title = resolveText(task.config.title)
 *   const description = resolveText(task.config.description)
 *
 * **User-context resolution:** the resolver looks up interpolation vars first
 * from `<LocaleProvider userContext={...}>`, falling back to
 * `<SegmentationProvider userContext={...}>` (Phase 2). Consumers who already
 * pass `userContext` to `<SegmentationProvider>` for audience targeting do not
 * need to re-pass it to `<LocaleProvider>` — the Locale wins when both are set,
 * but Segmentation is a no-config fallback.
 *
 * **Without any provider:** the default locale context has `userContext:
 * undefined`, so plain templates fall back to `{{x | default}}` rules and
 * keyed values resolve to the key itself in dev / empty in prod — same
 * contract as `useT()`.
 */
export function useResolveLocalizedText(): (value: LocalizedText | undefined) => string {
  const t = useT()
  const { userContext: localeUserContext } = useLocale()
  const { userContext: segmentationUserContext } = useSegmentationContext()
  const userContext = localeUserContext ?? segmentationUserContext
  return useCallback(
    (value) => {
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') {
        return interpolate(value, userContext, { warnOnMissing: false })
      }
      return t(value.key, userContext)
    },
    [t, userContext]
  )
}
