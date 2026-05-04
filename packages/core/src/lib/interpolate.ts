const TEMPLATE_RE = /\{\{\s*([^}|]+?)\s*(?:\|\s*([^}]*?))?\s*\}\}/g

export interface InterpolateOptions {
  /** Returned when a key is missing AND no inline fallback was given. Default: '' */
  defaultFallback?: string
  /** Logs unresolved keys to console.warn in dev. Default: true */
  warnOnMissing?: boolean
}

export function interpolate(
  template: string,
  vars: Record<string, unknown> | undefined,
  opts: InterpolateOptions = {}
): string {
  if (!template.includes('{{')) return template
  const { defaultFallback = '', warnOnMissing = process.env.NODE_ENV !== 'production' } = opts
  return template.replace(TEMPLATE_RE, (_match, rawKey: string, rawFallback?: string) => {
    const key = rawKey.trim()
    const value = getNestedValue(vars, key)
    if (value !== undefined && value !== null) return String(value)
    if (rawFallback !== undefined) return rawFallback.trim()
    if (warnOnMissing) console.warn(`[tour-kit] interpolate: missing key "${key}"`)
    return defaultFallback
  })
}

function getNestedValue(obj: unknown, path: string): unknown {
  if (!obj || typeof obj !== 'object') return undefined
  return path.split('.').reduce<unknown>((acc, k) => {
    if (acc && typeof acc === 'object' && k in acc) return (acc as Record<string, unknown>)[k]
    return undefined
  }, obj)
}
