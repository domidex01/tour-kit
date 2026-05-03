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
