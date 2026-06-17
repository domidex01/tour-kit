# @tour-kit/core

Framework-agnostic foundation layer. Contains all business logic - UI packages are thin wrappers.

## Key Architectural Decisions

### Barrel Exports
- Entry point (`src/index.ts`) re-exports from `types/`, `context/`, `hooks/`, `utils/`
- This allows tree-shaking while maintaining a clean public API

### Position Engine
- Core ships **RTL/placement helpers only** (`parsePlacement`, `mirrorPlacementForRTL`,
  `getElementRect`, `getViewportDimensions`, `getDocumentDirection`) in `utils/position.ts`.
- Core has **no** `@floating-ui` dependency. Actual collision/floating positioning lives in
  the UI packages (`react`, `announcements`, `hints`, `surveys`, `checklists`), which depend
  on `@floating-ui/react` directly.
- The old hand-rolled `calculatePosition()`/collision engine was removed in Slice 0 (dead,
  barrel-private).

### Storage Adapters
- `createStorageAdapter()` - Factory for custom storage backends
- `createPrefixedStorage()` - Namespaces keys to avoid collisions
- Default uses `localStorage` with JSON serialization via `safeJSONParse()`

### Focus Management
- `useFocusTrap()` - Traps focus within tour cards for accessibility
- `useKeyboardNavigation()` - Arrow keys, Escape, Enter handling
- All hooks respect `prefers-reduced-motion`

## Gotchas

- **Context null checks**: All context hooks throw if used outside provider - this is intentional
- **SSR**: Hooks handle SSR by checking `typeof window` before accessing DOM APIs
- **Refs over state**: Position-related values use refs to avoid re-render cascades

## Commands

```bash
pnpm --filter @tour-kit/core build
pnpm --filter @tour-kit/core typecheck
pnpm --filter @tour-kit/core test
```

## Related Rules
- `tour-kit/rules/hooks.md` - Hook design patterns
- `tour-kit/rules/accessibility.md` - A11y requirements
