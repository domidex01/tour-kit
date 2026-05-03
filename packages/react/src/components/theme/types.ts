export type ThemeTokens = Record<string, string>

export type ThemePredicate<TTraits = unknown> = (traits: TTraits) => boolean

export type ThemeMatcher =
  | { kind: 'system' }
  | { kind: 'dark' }
  | { kind: 'light' }
  | {
      kind: 'url'
      pattern: string | RegExp
      mode?: 'exact' | 'startsWith' | 'contains'
    }
  | { kind: 'predicate'; fn: ThemePredicate<unknown> }

export interface ThemeVariation {
  id: string
  when: ThemeMatcher
  theme: ThemeTokens
}

export interface ThemeResolveContext {
  systemColorScheme: 'light' | 'dark' | null
  route: string | null
  traits?: unknown
}

export interface ThemeContextValue {
  activeId: string
  tokens: ThemeTokens
}
