import type { ThemeMatcher, ThemeResolveContext, ThemeVariation } from './types'

export function matchUrl(matcher: Extract<ThemeMatcher, { kind: 'url' }>, route: string): boolean {
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

function findExplicit(variations: ThemeVariation[]): ThemeVariation | undefined {
  return variations.find((v) => v.when.kind === 'dark' || v.when.kind === 'light')
}

function findUrl(variations: ThemeVariation[], route: string | null): ThemeVariation | undefined {
  if (!route) return undefined
  return variations.find((v) => v.when.kind === 'url' && matchUrl(v.when, route))
}

function findSystem(
  variations: ThemeVariation[],
  scheme: 'light' | 'dark' | null
): ThemeVariation | undefined {
  if (!scheme) return undefined
  return variations.find((v) => v.when.kind === 'system')
}

export function resolveTheme(
  variations: ThemeVariation[],
  ctx: ThemeResolveContext
): ThemeVariation | null {
  return (
    findExplicit(variations) ??
    findUrl(variations, ctx.route) ??
    findSystem(variations, ctx.systemColorScheme) ??
    variations[0] ??
    null
  )
}
