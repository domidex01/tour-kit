---
"@tour-kit/react": minor
---

Add `<ThemeProvider>`, `resolveTheme`, and `ThemeMatcher` (discriminated union over `'system' | 'dark' | 'light' | 'url'`). Themes are applied via a `data-tk-theme` attribute on the provider root, switching CSS variables defined in `@tour-kit/react/styles/variables.css` without React tree re-renders for non-subscribed consumers. SSR-safe: the server-rendered HTML emits a fixed neutral `data-tk-theme="default"` and no inline CSS-variable style; the first client effect resolves the active variation and applies it. Phase 4b will add trait-predicate matchers.
