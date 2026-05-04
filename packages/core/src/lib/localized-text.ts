/**
 * `LocalizedText` is the shared shape for any human-readable string that
 * may either be a literal (interpolated via `interpolate`) or a dictionary
 * key (resolved via `useT()`). The discriminated union narrows on
 * `typeof === 'string'`, so existing string-based consumers stay assignable
 * — adding the object branch is a pure widening.
 */
export type LocalizedText = string | { key: string }

/**
 * Type guard: true when `value` is the `{ key: string }` branch of
 * `LocalizedText`. Returns false for plain strings, `undefined`, `null`,
 * arrays, primitives, and objects without a `key` property.
 */
export function isI18nKey(value: unknown): value is { key: string } {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    'key' in value &&
    typeof (value as { key: unknown }).key === 'string'
  )
}
