import type { ThemeMatcher, ThemeResolveContext, ThemeVariation } from './types'

export function matchUrl(
  matcher: Extract<ThemeMatcher, { kind: 'url' }>,
  route: string,
): boolean {
  const { pattern, mode = 'exact' } = matcher
  if (pattern instanceof RegExp) return pattern.test(route)
  switch (mode) {
    case 'exact':
      return route === pattern
    case 'startsWith':
      return route.startsWith(pattern)
    case 'contains':
      return route.includes(pattern)
    default:
      return route === pattern
  }
}

export function resolveTheme(
  variations: ThemeVariation[],
  ctx: ThemeResolveContext,
): ThemeVariation | null {
  for (const v of variations) {
    if (v.when.kind === 'dark' || v.when.kind === 'light') return v
  }
  if (ctx.route) {
    for (const v of variations) {
      if (v.when.kind === 'url' && matchUrl(v.when, ctx.route)) return v
    }
  }
  if (ctx.systemColorScheme) {
    for (const v of variations) {
      if (v.when.kind === 'system') return v
    }
  }
  return variations[0] ?? null
}
