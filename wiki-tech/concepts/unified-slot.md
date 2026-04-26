---
title: Unified Slot (Radix UI + Base UI)
type: concept
sources:
  - ../CLAUDE.md
  - ../packages/react/src/lib/slot.tsx
  - ../packages/react/CLAUDE.md
  - ../packages/*/src/lib/slot.tsx
updated: 2026-04-26
---

*Single component that supports both Radix UI's `asChild` element-cloning style and Base UI's render-prop style. Each UI package ships its own copy at `src/lib/slot.tsx`.*

## The problem

Two compositional patterns dominate the React UI ecosystem:

| Pattern | Library | Shape |
|---|---|---|
| `asChild` element cloning | Radix UI | `<Button asChild><MyLink>...</MyLink></Button>` |
| Render prop | Base UI | `<Button render={(props) => <MyLink {...props}>...</MyLink>} />` |

Tour Kit components support **both**, so consumers can stay in their existing UI library without juggling two paradigms.

## The solution: `UnifiedSlot`

```ts
type RenderProp = (props: Record<string, unknown>) => React.ReactNode

type UnifiedSlotProps = {
  children: React.ReactNode | RenderProp
  // ...standard React props get merged onto the rendered element
}

UnifiedSlot({ children, ...props })
```

Behaviour:

- `typeof children === 'function'` → call it with props (Base UI style)
- `React.isValidElement(children)` → clone with merged props and refs (Radix style)
- Otherwise render children as-is

Refs from both parent and child are merged automatically.

## Where it lives

Each UI package ships **its own copy** in `lib/slot.tsx`:

- `@tour-kit/react`
- `@tour-kit/hints`
- `@tour-kit/adoption`
- `@tour-kit/announcements`
- `@tour-kit/checklists`
- `@tour-kit/media`
- `@tour-kit/surveys`

Yes, this is duplication on purpose. Each package can vary the implementation and avoid a shared peer dep just for slotting.

## UI library context

```ts
import { UILibraryProvider, useUILibrary } from '@tour-kit/react'

<UILibraryProvider library="base-ui">
  <YourApp />
</UILibraryProvider>
```

`UILibrary = 'radix' | 'base-ui'`. Defaults to `'radix'`. Components inspect this context to choose which integration shape to prefer when both work.

## Consumer usage

### Radix style

```tsx
<TourCardFooter asChild>
  <MyCustomFooter />
</TourCardFooter>
```

### Base UI style

```tsx
<TourCardFooter>
  {(props) => <MyCustomFooter {...props} />}
</TourCardFooter>
```

Both produce identical output.

## Gotchas

- **Don't lose refs.** If you write a custom slot consumer, forward refs through both branches.
- **No double-wrapping.** Don't pass `asChild` and a render-prop child simultaneously — one wins, the other is dropped silently.
- **Per-package copies drift.** When updating slot logic, search across all `lib/slot.tsx` files to keep them aligned.

## Related

- [packages/react.md](../packages/react.md)
- [packages/hints.md](../packages/hints.md)
- [architecture/provider-architecture.md](../architecture/provider-architecture.md)
