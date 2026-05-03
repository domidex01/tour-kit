---
"@tour-kit/react": patch
---

Add `'predicate'` matcher to `ThemeMatcher` and a `traits?: TTraits` prop to `<ThemeProvider>` (now generic: `<ThemeProvider<TTraits>>`). Predicates are evaluated after URL match and before system fallback, so `(traits) => traits.plan === 'enterprise'` flips the active variation as your host data changes. New `useThemeVariation()` hook returns the active `{ activeId, tokens }` with a stable reference identity across unrelated re-renders — safe in `useEffect` deps. Memoize `traits` at the consumer to honor the perf budget; an inline `traits={{ ... }}` object creates a new reference each render and forces the resolver effect to re-run. See the new `guides/theme-variations.mdx` page.
