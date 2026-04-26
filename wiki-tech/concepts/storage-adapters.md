---
title: Storage adapters
type: concept
sources:
  - ../packages/core/src/utils/storage.ts
  - ../packages/core/src/hooks/use-persistence.ts
  - ../packages/core/src/types
updated: 2026-04-26
---

*Pluggable persistence. Default uses `localStorage` with JSON serialization. Swap for cookies, memory, sessionStorage, IndexedDB, remote — anything matching the `Storage` interface.*

## Interface

```ts
interface Storage {
  getItem(key: string): string | null
  setItem(key: string, value: string): void
  removeItem(key: string): void
}
```

This matches the Web Storage API, so `window.localStorage` and `window.sessionStorage` work directly.

## Built-in adapters

| Factory | Backend | Notes |
|---|---|---|
| `createStorageAdapter(backend?)` | localStorage by default | Customizable |
| `createNoopStorage()` | nothing | For SSR / testing |
| `createCookieStorage(options)` | document.cookie | Domain/path/expiry options |
| `createPrefixedStorage(adapter, prefix)` | wraps any | Avoids key collisions across packages |

## Helpers

```ts
safeJSONParse<T>(value: string | null, fallback: T): T
```

Parses JSON safely. Returns `fallback` on `null`, `undefined`, or parse error. Used internally everywhere persistence reads from storage.

## Prefix convention

Each Tour Kit package uses prefixed storage to avoid collisions:

| Package | Prefix |
|---|---|
| `core` (tour state) | `tourkit-tour-` |
| `hints` | `tourkit-hint-` |
| `adoption` | `tourkit-adoption-` |
| `checklists` | `tourkit-checklist-` |
| `announcements` | `tourkit-announcement-` |
| `surveys` | `tourkit-survey-` |
| `license` | `tourkit-license-{domain}` |

(Exact prefixes per package live in their respective providers — grep for `createPrefixedStorage(` to verify.)

## SSR safety

`createStorageAdapter()` returns a no-op when `typeof window === 'undefined'`. Components built on storage hooks (`usePersistence`, `useRoutePersistence`) check this before any read/write.

## Custom adapters

```ts
const remoteAdapter: Storage = {
  getItem: (k) => fetch(`/api/state/${k}`).then(r => r.text()),  // sync API though
  setItem: (k, v) => navigator.sendBeacon('/api/state', JSON.stringify({ k, v })),
  removeItem: (k) => fetch(`/api/state/${k}`, { method: 'DELETE' }),
}
```

Note: the interface is **synchronous** by design (mirrors Web Storage). For async backends, wrap with a memory cache that flushes asynchronously.

## Related

- [packages/core.md](../packages/core.md)
- [concepts/license-gating.md](license-gating.md) — `LicenseCache` uses a similar pattern with Zod validation
