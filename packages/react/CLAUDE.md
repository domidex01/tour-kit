# @tour-kit/react

React components and hooks for tours. Most complex package - read carefully.

## Key Architectural Decisions

### Router Adapters (Factory + Hook Pattern)
Two patterns exist for each router framework:

1. **Factory**: `createNextAppRouterAdapter(usePathname, useRouter)` - For custom setups
2. **Direct hook**: `useNextAppRouter()` - Uses dynamic `require()` internally

**Why both?** The factory allows testing without Next.js installed. The hook is convenient for consumers.

**Gotcha**: Direct hooks use `require()` which throws if the framework isn't installed.

### Re-exports from Core
This package re-exports everything from `@tour-kit/core`. Consumers should import from `@tour-kit/react` only - never mix imports.

### Unified Slot (Radix + Base UI)
Located at `src/lib/unified-slot.tsx`. Handles both patterns:
- Render prop (Base UI): `typeof children === 'function'` → call with props
- Element cloning (Radix): `React.isValidElement(children)` → clone with merged props

### Multi-Tour Registry
`MultiTourKitProvider` allows multiple tours to be registered declaratively. Tours are stored in context and can be triggered by ID.

### Component Split
- `components/*/` - Styled components (use Tailwind classes)
- `components/headless/` - Logic-only components (render props pattern)
- `components/ui/` - Variant definitions using `class-variance-authority`

## Gotchas

- **'use client'**: All component files need this directive for Next.js App Router
- **Ref merging**: `UnifiedSlot` merges refs from both parent and child - don't lose refs
- **Router initialization**: `onRouteChange` callback fires immediately with current route

## Commands

```bash
pnpm --filter @tour-kit/react build
pnpm --filter @tour-kit/react typecheck
pnpm --filter @tour-kit/react test
```

## Related Rules
- `tour-kit/rules/components.md` - Component patterns
- `tour-kit/rules/react.md` - React conventions
