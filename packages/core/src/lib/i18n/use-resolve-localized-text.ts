import { useCallback } from 'react'
import { interpolate } from '../interpolate'
import { type LocalizedText, isI18nKey } from '../localized-text'
import { useSegmentationContext } from '../segmentation/segmentation-context'
import { useT } from './use-t'

/**
 * Returns a memoized resolver `(value) => string` that takes a `LocalizedText`
 * (or `undefined`) and returns the rendered string. Intended for any component
 * that surfaces consumer-authored copy where the output must be a `string`
 * (e.g. `aria-label`, `title` attributes, `Dialog.Title` props).
 *
 *   const resolveText = useResolveLocalizedText()
 *   const title = resolveText(task.config.title)
 *
 * For `ReactNode` pass-through use `useResolvedText` (per-package hook in
 * `@tour-kit/react` / `@tour-kit/hints`) — it returns `ReactNode` so consumers
 * can pass JSX through arbitrary `LocalizedText | ReactNode` fields.
 *
 * **Vars source:** `useSegmentationContext().userContext`. Consumers who pass
 * `userContext` to `<SegmentationProvider>` for audience targeting get
 * automatic interpolation against the same data with no extra plumbing.
 *
 * **Without any provider:** the default segmentation context has
 * `userContext: undefined`, so plain templates fall back to `{{x | default}}`
 * rules and keyed values resolve to the key itself in dev / empty in prod —
 * the same contract as `useT()`.
 */
export function useResolveLocalizedText(): (value: LocalizedText | undefined) => string {
  const t = useT()
  const { userContext } = useSegmentationContext()
  return useCallback(
    (value) => {
      if (value === undefined || value === null) return ''
      if (typeof value === 'string') {
        return interpolate(value, userContext, { warnOnMissing: false })
      }
      if (isI18nKey(value)) return t(value.key, userContext)
      return ''
    },
    [t, userContext]
  )
}
