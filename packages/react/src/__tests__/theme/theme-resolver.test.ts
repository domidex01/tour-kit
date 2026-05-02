import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import { matchUrl, resolveTheme } from '../../components/theme/theme-resolver'
import type { ThemeVariation } from '../../components/theme/types'

const dark: ThemeVariation = { id: 'dark', when: { kind: 'dark' }, theme: {} }
const light: ThemeVariation = { id: 'light', when: { kind: 'light' }, theme: {} }
const system: ThemeVariation = { id: 'system', when: { kind: 'system' }, theme: {} }
const billing: ThemeVariation = {
  id: 'billing',
  when: { kind: 'url', pattern: '/billing' },
  theme: {},
}

describe('resolveTheme: priority order (US-1)', () => {
  it('explicit dark wins over URL match', () => {
    const result = resolveTheme([dark, billing], {
      systemColorScheme: 'light',
      route: '/billing',
    })
    expect(result?.id).toBe('dark')
  })

  it('explicit light wins over URL match in declaration order', () => {
    const result = resolveTheme([light, billing], {
      systemColorScheme: 'dark',
      route: '/billing',
    })
    expect(result?.id).toBe('light')
  })

  it('URL match wins over system fallback', () => {
    const result = resolveTheme([billing, system], {
      systemColorScheme: 'light',
      route: '/billing',
    })
    expect(result?.id).toBe('billing')
  })

  it('system fallback when no URL match', () => {
    const result = resolveTheme([billing, system], {
      systemColorScheme: 'dark',
      route: '/unmatched',
    })
    expect(result?.id).toBe('system')
  })

  it('falls back to first variation when nothing matches', () => {
    const result = resolveTheme([billing, system], {
      systemColorScheme: null,
      route: null,
    })
    expect(result?.id).toBe('billing')
  })

  it('returns null when variations is empty', () => {
    expect(
      resolveTheme([], { systemColorScheme: 'light', route: '/anywhere' }),
    ).toBeNull()
  })
})

describe('matchUrl modes (US-1)', () => {
  it.each([
    ['exact match', { kind: 'url' as const, pattern: '/billing' }, '/billing', true],
    ['exact non-match', { kind: 'url' as const, pattern: '/billing' }, '/dashboard', false],
    [
      'startsWith hit',
      { kind: 'url' as const, pattern: '/admin', mode: 'startsWith' as const },
      '/admin/users',
      true,
    ],
    [
      'startsWith miss',
      { kind: 'url' as const, pattern: '/admin', mode: 'startsWith' as const },
      '/billing',
      false,
    ],
    [
      'contains hit',
      { kind: 'url' as const, pattern: 'billing', mode: 'contains' as const },
      '/v2/billing/details',
      true,
    ],
    [
      'contains miss',
      { kind: 'url' as const, pattern: 'billing', mode: 'contains' as const },
      '/v2/dashboard',
      false,
    ],
    ['regex hit', { kind: 'url' as const, pattern: /^\/admin/ }, '/admin/users', true],
    ['regex miss', { kind: 'url' as const, pattern: /^\/admin/ }, '/billing', false],
  ])('%s', (_label, matcher, route, expected) => {
    expect(matchUrl(matcher, route as string)).toBe(expected)
  })
})

describe('resolver purity (US-4)', () => {
  const resolverPath = resolve(
    dirname(fileURLToPath(import.meta.url)),
    '../../components/theme/theme-resolver.ts',
  )
  const source = readFileSync(resolverPath, 'utf-8')

  it('does not import react or react-dom', () => {
    expect(source).not.toMatch(/from\s+['"]react['"]/)
    expect(source).not.toMatch(/from\s+['"]react-dom['"]/)
  })

  it('does not reference window or document', () => {
    expect(source).not.toMatch(/\bwindow\b/)
    expect(source).not.toMatch(/\bdocument\b/)
  })
})
