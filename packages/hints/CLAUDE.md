# @tour-kit/hints

Persistent hints/hotspots that exist outside the tour flow.

## Key Differences from Tours

- **Lifecycle**: Hints persist until explicitly dismissed (tours are sequential)
- **State**: Each hint has independent open/dismissed state
- **Positioning**: Hotspots attach to elements, tooltips float nearby

## Architecture

### Context Pattern
- `HintsProvider` → manages all hints state
- `useHints()` → access all hints
- `useHint(id)` → access single hint by ID

### Component Hierarchy
```tsx
<HintsProvider hints={[...]}>
  <HintHotspot hintId="feature-x">  {/* The pulsing dot */}
    <HintTooltip>                    {/* The popup content */}
      <HintContent />
    </HintTooltip>
  </HintHotspot>
</HintsProvider>
```

### Dismissal Patterns
- `dismiss()` - Mark as dismissed (won't show again)
- `hide()` - Close temporarily (can reopen)
- Dismissal state persists via storage adapter

## Engine (`@tour-kit/hints/engine`, v3 Phase 1)

The state machine lives in `src/lib/hints-engine/` and is published React-free
at `@tour-kit/hints/engine`: `createHintsEngine`, `createHintsHandle`,
`INITIAL_HINTS_STATE`, `getHotspotPosition`. `HintsProvider` is a **binding**
over it — one handle in `useState`, one `useSyncExternalStore`, two effects.

Rules that bite:

- **Every file under `src/lib/hints-engine/` imports core as
  `@tour-kit/core/engine`, never bare `@tour-kit/core`, and never `../../types`,
  `../../hooks`, `../../context` or `../../components`.** `src/types/index.ts`
  imports `react` and `@tour-kit/media`; one type import from it puts both in
  the engine's declaration closure. A TYPE import leaves no trace in the built
  bytes, so only the source-walk case in `no-react-in-engine-dist.test.ts`
  catches it.
- **The engine is inert until `boot()`.** No `window`, no storage, no clock in
  the constructor. Storage resolves at `boot()` and is read once.
- **Seed the factory.** `<Hint autoShow>` and `useHint` call verbs from their own
  mount effects, which run *before* the provider's. The factory handed to
  `createHintsHandle` must construct, `setHints` and `boot()`, or the first verb
  runs against an engine with no configs and no storage. Pinned by
  `src/__tests__/integration/hint-autoshow-frequency.test.tsx`.
- **Never add `'engine/index'` to `injectUseClient`.** It would mark a
  framework-agnostic entry client-only. Asserted on both the built bytes and the
  tsup config.
- **Guards read the import CLOSURE, never the entry.** This package builds with
  `splitting: true`, so `dist/engine/index.js` is a re-export shell; a scan of it
  passes forever.
- `hintsReducer` stays internal, as core withholds `tourReducer`.

## Gotchas

- **Hint vs Tour**: Don't use hints for sequential onboarding - use tours
- **Z-index**: Hotspots and tooltips need high z-index to appear above content
- **Visibility**: Check `isElementVisible()` before showing hotspot

## Commands

```bash
pnpm --filter @tour-kit/hints build
pnpm --filter @tour-kit/hints typecheck
pnpm --filter @tour-kit/hints test
```

## Reduced motion

`<HintHotspot>` reads `useReducedMotion()` from `@tour-kit/core` and gates the `pulse` cva variant: under reduce mode, `shouldPulse = pulse && !isOpen && !reducedMotion` resolves to `false` and the `animate-tour-pulse` class is never applied. CSS keyframe wrappers in `src/styles/{theme,variables}.css` are kept as defense-in-depth. See the cross-package contract in the repo-root [CLAUDE.md § Reduced motion](../../CLAUDE.md) and the user-facing guide at [`apps/docs/content/docs/guides/reduced-motion.mdx`](../../apps/docs/content/docs/guides/reduced-motion.mdx). `useReducedMotion` is re-exported from `@tour-kit/hints`.

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/accessibility.md` - A11y requirements
