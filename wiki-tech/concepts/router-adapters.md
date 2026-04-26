---
title: Router adapters
type: concept
sources:
  - ../packages/react/src/adapters
  - ../packages/react/CLAUDE.md
  - ../packages/core/src/types  # RouterAdapter type
  - ../packages/core/src/hooks/use-route-persistence.ts
updated: 2026-04-26
---

*Tour Kit needs to know "what's the current route?" to support multi-page tours and route-based persistence. Each framework provides this differently — adapters normalize the contract.*

## The contract

```ts
type RouterAdapter = {
  pathname: string
  push(path: string): void
  replace(path: string): void
  onRouteChange(callback: (pathname: string) => void): () => void  // returns unsubscribe
}
```

(Type lives in `@tour-kit/core/types`.)

## Built-in adapters (`@tour-kit/react`)

Two patterns per framework:

### Factory (testable, dep-injected)

```ts
createNextAppRouterAdapter(usePathname, useRouter)
createNextPagesRouterAdapter(useRouter)
createReactRouterAdapter(useLocation, useNavigate)
```

The factory takes the router primitives as arguments — perfect for unit tests that don't want to install Next.js or React Router.

### Direct hook (convenient, dynamic require)

```ts
useNextAppRouter()
useNextPagesRouter()
useReactRouter()
```

These call the framework primitives via dynamic `require()`. They throw if the framework isn't installed — that's the trade-off for ergonomics.

## When to use which

| Situation | Use |
|---|---|
| Production code in a Next/React Router app | Direct hook |
| Unit tests | Factory with mocked primitives |
| Custom routing (non-Next, non-RR) | Build your own adapter matching `RouterAdapter` |

## Multi-page persistence

```ts
useRoutePersistence(config: MultiPagePersistenceConfig)
```

Tracks tour state across route changes. Pairs with a `RouterAdapter` to know when navigation happens.

## Initialization quirk

`onRouteChange(cb)` fires immediately with the current route on subscribe — not just on subsequent navigations. Consumers should expect the callback to run synchronously during the first `useEffect`.

## Related

- [packages/react.md](../packages/react.md)
- [packages/core.md](../packages/core.md)
