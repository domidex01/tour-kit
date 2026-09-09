---
'@tour-kit/analytics': minor
---

Add `@tour-kit/analytics/engine`, a React-free subpath exposing the tracker and
the five plugins for non-React consumers.

```ts
import { createAnalytics, consolePlugin } from '@tour-kit/analytics/engine'
```

Its runtime and its `.d.ts` chain name no `react`, no `react/jsx-runtime` and
no `@tour-kit/license`, so a Vue, Svelte or Node project can build and
typecheck against it with none of them installed. `AnalyticsProvider` and the
two hooks stay on the main entry.

The main entry and the four plugin entries now import `logger` from
`@tour-kit/core/engine` rather than the bare `@tour-kit/core`. No runtime
change — both core entries read the same chunk — but a bundler no longer has to
resolve core's React barrel to tree-shake it.
