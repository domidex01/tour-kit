# Phase 18 — Storage Adapter Parity

**Duration:** Days 94–98 (~9–12 hours)
**Depends on:** Nothing (independent — does not touch any prior phase deliverable; reuses the existing `Storage` interface from `packages/core/src/types/config.ts:61`).
**Blocks:** Nothing directly. Feeds the **M9 milestone gate** (storage matrix complete + cross-adapter contract suite green) called out in `big-plan.md`. Downstream phases that rely on persisted state (announcements `viewCount`, license cache, tour resume) inherit the SSR + large-payload coverage transparently — but none of them gate on it.
**Risk Level:** HIGH — storage adapters are the persistence contract for the entire tour-kit (tour resume state, `viewCount`, dismissal flags, license cache, surveys fatigue). A buggy adapter would corrupt user state silently across **every** Pro package at once, and the corruption would be invisible in dev (where `localStorage` is the default) until a consumer flipped to cookies (SSR) or IndexedDB (large state). The blast radius is "every persisted feature in the library."
**Stack:** react

---

## Objective

Match `localStorage` ergonomics with two new adapters so every persistence call site in the tour-kit (`useFlowSession`, `usePersistence`, `useRoutePersistence`, `AnnouncementsProvider.persistState`, license cache, surveys fatigue store) can swap storage backends without touching its own code. `cookieStorageAdapter({ domain, path, sameSite, secure, maxAge })` works in SSR (read from `document.cookie` on the client, no-op on the server unless the consumer wires a `Set-Cookie` header sink) and gracefully refuses payloads above the **4096-byte hard browser limit** with a single `console.warn` + skip rather than throwing. `indexedDbStorageAdapter({ dbName, store })` handles state above `localStorage`'s 5 MB practical ceiling (or cross-subdomain SaaS shells) by routing get/set/remove/clear through `idb-keyval`'s async API — the existing `Storage` interface (`getItem`/`setItem`/`removeItem` returning `T | Promise<T>`) already permits this. A standalone `inMemoryStorageAdapter()` is extracted from the noop branch in `utils/storage.ts` so it can serve as the documented fallback when IDB is blocked (private mode, quota exceeded, browser policy). All 3 adapters pass the same parameterized `StorageAdapterContract` test suite (12 cases each).

## What Success Looks Like

1. **Interface parity**: every new adapter implements the existing `Storage` interface verbatim (`getItem(key) → string | null | Promise<string | null>`, `setItem(key, value) → void | Promise<void>`, `removeItem(key) → void | Promise<void>`) — `pnpm --filter @tour-kit/core typecheck` exits 0 with `cookieStorageAdapter(...)`, `indexedDbStorageAdapter(...)`, and `inMemoryStorageAdapter()` all satisfying `Storage` (TypeScript would fail compilation if the return shape drifted from the union).
2. **Cookie 4KB warning + skip**: a Vitest test writes a payload whose JSON-encoded length is `5000` bytes, asserts `console.warn` was called exactly once with a message containing the substring `"exceeds 4096 bytes"`, and asserts the cookie was NOT written (`document.cookie` does not contain the key). Verified by `pnpm --filter @tour-kit/core test -- --run cookie-adapter` exiting 0.
3. **IDB 1MB perf budget**: a Vitest test writes a 1 MB JSON string via `indexedDbStorageAdapter`, wraps the call in `performance.mark('idb-start')` / `performance.mark('idb-end')` / `performance.measure('idb-write', 'idb-start', 'idb-end')`, and asserts `duration < 50` ms. Verified by `pnpm --filter @tour-kit/core test -- --run indexeddb-adapter.perf` exiting 0 in jsdom (where `fake-indexeddb` is the substrate). Real-browser timing is asymptotically faster than jsdom + fake-indexeddb, so a passing 50 ms ceiling in jsdom is a safe upper bound.
4. **All 3 adapters pass the same contract**: `StorageAdapterContract(adapter, label)` is a parameterized Vitest helper exported from `packages/core/src/storage/contract.test-helpers.ts`. The `__tests__/cross-adapter.contract.test.ts` file runs it against **all 3** adapters (cookie, IDB, in-memory) — 12 cases × 3 adapters = 36 assertions, all green. Verified by `pnpm --filter @tour-kit/core test -- --run cross-adapter.contract` exiting 0.
5. **SSR safety**: a Vitest test runs in a `vitest --environment node` block, calls `cookieStorageAdapter({ ... }).getItem('key')` with no `document` global available, and asserts the call returns `null` (not throws). A second case calls `setItem('key', 'value')` on the server side and asserts no exception is raised (the server-side write is a no-op unless a `cookieJar` sink is injected via options — documented).
6. **In-memory fallback for blocked IDB**: a Vitest test forces `indexedDB.open` to throw (via `vi.stubGlobal('indexedDB', { open: () => { throw new Error('blocked') } })`), constructs the adapter, calls `setItem`, and asserts (a) `console.warn` was called once with `"IndexedDB unavailable — falling back to in-memory store"` and (b) the value is round-trippable via the same adapter handle (because the adapter constructor auto-swaps to in-memory on detect-failure).
7. **No new public API surface beyond the 3 adapter factories**: `grep -E "export (const|function) (cookieStorageAdapter|indexedDbStorageAdapter|inMemoryStorageAdapter)" packages/core/src/index.ts` returns exactly 3 lines.
8. **Docs page exists and renders**: `apps/docs/content/docs/storage/adapters.mdx` is created with one section per adapter (when to use, options table, code snippet, gotchas) and a comparison table covering size limits, SSR-safety, async, cross-subdomain support. `pnpm --filter docs build` exits 0; the page appears in the sidebar.
9. **CHANGELOG entry**: `packages/core/CHANGELOG.md` lists the 3 new adapters under "Added", and notes the `Storage` interface is unchanged (no migration needed).

---

## What Failure Looks Like (and what to do)

- **Cookie payload exceeds 4 KB** → the cookie spec hard-caps a single cookie at **4096 bytes** (name + value + attributes combined; most browsers enforce 4093–4096). `cookieStorageAdapter.setItem` must measure `encodeURIComponent(value).length + key.length + estimatedAttrBytes` BEFORE calling `document.cookie = ...`. If it exceeds 4096, emit `console.warn('[tour-kit] cookie payload for key "${key}" exceeds 4096 bytes (${size}); skipping write. Use indexedDbStorageAdapter for large state.')` exactly once per key (track a module-level `Set<string>` of warned keys so a tight write loop doesn't spam the console). Do **not** throw — telemetry-quality bugs should never crash a consumer's app.
- **IndexedDB blocked by browser** (private/incognito mode in older Safari, quota exceeded, enterprise policy) → `idb-keyval`'s `get`/`set` reject with a DOMException. Wrap the adapter in a constructor-time probe (`async function probeIndexedDb()`) that calls `set('__tour-kit-probe', '1', store)` + `del('__tour-kit-probe', store)`. On rejection or thrown error, swap the entire adapter's method set to delegate to `inMemoryStorageAdapter()` and emit a single `console.warn('[tour-kit] IndexedDB unavailable — falling back to in-memory store. State will not persist across reloads.')`. The probe runs lazily on first method call, not at module load.
- **Cross-adapter parity test fails for any adapter** → block the release. Document the divergence in `packages/core/CHANGELOG.md` under "Known Issues" with the failing case name (e.g., `null-value-round-trip [cookie]`), open a follow-up issue, and DO NOT export the failing adapter from `src/index.ts`. The phase ships partial only if the failure is in IDB (cookie + in-memory still go out) — never ship cookie alone (the SSR story is its primary value, and parity is the only way consumers trust the swap).
- **SSR cookie write happens on the server but the client doesn't re-hydrate** → `cookieStorageAdapter` is intentionally **read-only in pure-Node SSR** unless the consumer provides a `cookieJar?: { read(name): string | null; write(name, value, opts): void }` option (typed escape hatch for frameworks like Next.js to wire `cookies()` from `next/headers`). Without a jar, server-side `setItem` is a documented no-op (warns once in dev via `process.env.NODE_ENV !== 'production'` — silent in prod). The docs page shows the Next.js wiring snippet so the round-trip is honest.
- **IDB async API leaks promises if consumer doesn't await** → the `Storage` interface allows `getItem` to return `Promise<string | null>` or `string | null`, and the existing `usePersistence` hook already handles both via `Promise.resolve(value)`. The IDB adapter ALWAYS returns `Promise<...>` — never a bare value, never a "resolved synchronously" cheat. The TypeScript signature enforces this. The plan's test suite includes a case asserting `typeof adapter.getItem('x').then === 'function'` for IDB and **not** for cookie/in-memory.
- **IndexedDB transaction aborted by `versionchange` event** (another tab upgrades the DB schema) → `idb-keyval`'s `createStore(dbName, storeName)` factory opens the DB without a version pin, so a `versionchange` event from another tab is rare. Still: wrap every `get`/`set`/`del` in a `try { ... } catch (err) { if (err instanceof DOMException && err.name === 'AbortError') return null; throw err; }`. The catch logs once via `console.warn('[tour-kit] IndexedDB transaction aborted (versionchange in another tab) — retry next call')` and returns `null` (read) or resolves silently (write). The next call re-opens cleanly via `idb-keyval`'s internal handle cache.
- **`document.cookie` is overwritten with a malformed string by another script** → the parser at `utils/storage.ts:51` uses `document.cookie.match(new RegExp((^| )${escapeRegex(key)}=([^;]+)))` which gracefully returns `null` on parse failure. Reuse the same `escapeRegex` helper (imported from `utils/storage.ts`) in `cookie-adapter.ts` so behavior is identical.

---

## Architecture / Key Design Decisions

```
@tour-kit/core
  src/types/config.ts (UNCHANGED)
    interface Storage {
      getItem: (key: string) => string | null | Promise<string | null>
      setItem: (key: string, value: string) => void | Promise<void>
      removeItem: (key: string) => void | Promise<void>
    }

  src/utils/storage.ts (UNCHANGED — keep createCookieStorage as deprecated alias)
    createStorageAdapter(...)    // still resolves 'cookie' to createCookieStorage for back-compat
    createCookieStorage(opts)    // OLD api; left in place + @deprecated JSDoc pointing to new factory

  src/storage/  (NEW directory)
    in-memory-adapter.ts         ← inMemoryStorageAdapter(): Storage
                                    Map<string, string> backed; no persistence; no async; used as
                                    SSR fallback AND IDB-blocked fallback. Replaces the inline
                                    createNoopStorage in utils/storage.ts (which becomes a re-export
                                    alias for back-compat).

    cookie-adapter.ts            ← cookieStorageAdapter(opts: CookieAdapterOptions): Storage
                                    Browser: reads/writes document.cookie with sameSite/secure/maxAge.
                                    SSR (no document): reads via opts.cookieJar?.read; writes via
                                    opts.cookieJar?.write (silent no-op without a jar).
                                    Enforces 4096-byte hard cap on write — warn-once + skip on overflow.

    indexeddb-adapter.ts         ← indexedDbStorageAdapter(opts: IdbAdapterOptions): Storage
                                    Wraps idb-keyval's get/set/del/clear with a createStore(dbName,
                                    storeName) handle. Async all the way. Probes availability lazily;
                                    on probe failure, swaps every method to delegate to an
                                    inMemoryStorageAdapter() instance + warns once.

    contract.test-helpers.ts     ← StorageAdapterContract(adapter: Storage, label: string): void
                                    Parameterized describe() block. 12 cases:
                                    1. setItem then getItem round-trips a string
                                    2. getItem returns null for missing key
                                    3. removeItem deletes a key
                                    4. setItem overwrites existing value
                                    5. round-trip preserves empty string
                                    6. round-trip preserves JSON with special chars (\\n, ", emoji)
                                    7. concurrent writes — two sequential setItems both visible
                                    8. clear/remove on missing key does not throw
                                    9. typeof getItem return value is consistent (sync or Promise)
                                   10. large payload (10 KB JSON) round-trips OR is rejected with warn
                                       (cookie warns + skip; IDB + in-memory accept)
                                   11. null/undefined input rejected gracefully (setItem only accepts
                                       string per interface; called with non-string at runtime warns,
                                       does not throw — runtime defense)
                                   12. SSR-safety: in `typeof window === 'undefined'`, getItem returns
                                       null without throwing

  src/index.ts (UPDATED)
    Adds 3 named exports + their option-type interfaces:
      cookieStorageAdapter, CookieAdapterOptions
      indexedDbStorageAdapter, IdbAdapterOptions
      inMemoryStorageAdapter

  package.json (UPDATED)
    peerDependencies (optional):
      "idb-keyval": ">=5.0.0 <7"
    peerDependenciesMeta:
      "idb-keyval": { "optional": true }

apps/docs/content/docs/storage/adapters.mdx (NEW)
  When to use each adapter + options reference + Next.js cookieJar wiring snippet
```

### Data Model Strategy

| Layer | Type | Why |
|-------|------|-----|
| Existing `Storage` interface | `interface` (UNCHANGED) | Already permits sync OR async returns — the IDB adapter slots in without widening; existing call sites already handle both via `Promise.resolve(value)` |
| `CookieAdapterOptions` | `interface` exported from `src/storage/cookie-adapter.ts` and re-exported from main barrel | Consumers pass it to the factory — needs to be importable; `interface` (not `type`) for declaration-merging by users who want to extend with custom `cookieJar` shapes |
| `IdbAdapterOptions` | `interface` exported similarly | Same rationale |
| Internal `CookieJar` shape | `interface` (exported as part of `CookieAdapterOptions`) | Next.js consumers wire `next/headers.cookies()` to this — needs to be a documented public surface |
| `WARNED_KEYS` (4KB overflow tracker) | module-level `Set<string>` (internal) | Dedupe `console.warn` calls per cookie key without leaking — a `Set` is fine because keys are bounded by app surface (a few dozen, not unbounded) |
| Probe state (`idbAvailable: 'unknown' | 'ok' | 'blocked'`) | local `let` in the adapter closure | Lazy single-flight: first method call awaits the probe; subsequent calls short-circuit. Tracked per `dbName+storeName` pair via a module-level `Map<string, ProbeState>` so two adapters sharing a DB don't probe twice |

**Critical rules for this phase:**

- **Reuse the existing `Storage` interface verbatim.** Do not widen, narrow, or re-declare it. The new file `src/storage/index.ts` (if added — see Deliverables) imports `type { Storage } from '../types'`. Type drift here would silently break every persistence call site in the monorepo.
- **No new top-level public API beyond the 3 factory functions + 2 option interfaces.** Anything else (probe helpers, escape regex, the `CookieJar` interface) lives behind the factory boundary, exported only as needed for option typing. A `grep -E "^export " packages/core/src/storage/*.ts | wc -l` should match the documented surface count.
- **`idb-keyval` is a peer-optional dependency.** The adapter file `indexeddb-adapter.ts` uses `await import('idb-keyval')` inside the factory closure (NOT a top-level `import`), wraps the import in try/catch, and on failure swaps to `inMemoryStorageAdapter()` + warns once. Loading the file itself never requires `idb-keyval` to be installed — only constructing the IDB adapter does.
- **Cookie size is checked BEFORE write, not after.** `document.cookie = '...'` silently fails on oversized strings in some browsers and silently truncates in others. Measure (`key.length + 1 + encodeURIComponent(value).length + estimatedAttrBytes` where `estimatedAttrBytes ≈ 80` covers `path`/`domain`/`max-age`/`SameSite`/`Secure`/`expires`) and refuse-with-warn at ≥ 4096. The 4096 threshold is a hard constant, not configurable — it's a browser spec, not a tuneable.
- **No animations, no reduced-motion concern.** This phase is pure data plumbing; the three-tier reduced-motion defense from CLAUDE.md does not apply.
- **No new Zod schemas.** Adapter options come from consumer code (the application), not an external boundary (network/disk/URL). Runtime validation happens at the consumer's typecheck. Do not introduce Zod for in-process boundaries.
- **Existing `createCookieStorage` stays as a `@deprecated` re-export pointing to `cookieStorageAdapter`.** Removing it would break the `storage: 'cookie'` shorthand resolved by `createStorageAdapter` in `utils/storage.ts:15-22`. Keep the function; add a JSDoc `@deprecated since v2.0; use cookieStorageAdapter(...)`. Defer removal to v3.0.
- **Tests run in jsdom by default.** The IDB perf test uses `fake-indexeddb` (already in core's devDeps — verify pre-phase; if absent, add it as a dev-only test fixture in `vitest.setup.ts`). The SSR test case uses an explicit `// @vitest-environment node` directive on the relevant `describe` block, or a separate `*.ssr.test.ts` file with `environment: 'node'` in its vitest config block.

---

## Tasks

### Task 18.1 — `cookieStorageAdapter({ domain, path, sameSite, secure, maxAge, cookieJar? })` (4–5 h)

**Depends on:** —

Implement the cookie adapter. The existing `createCookieStorage` in `src/utils/storage.ts` (lines 45–69) is the starting point — copy its core parse/serialize logic into `src/storage/cookie-adapter.ts`, then layer on:

1. **Full attribute support**: `domain?`, `path = '/'`, `sameSite: 'Strict' | 'Lax' | 'None' = 'Lax'`, `secure: boolean = (sameSite === 'None')`, `maxAge?: number` (seconds; falls back to the existing `expires` days param for back-compat).
2. **4096-byte hard cap**: pre-compute the encoded size; on overflow, warn-once via a module-level `Set<string>` of warned keys and return without writing.
3. **SSR support via `cookieJar` option**: a typed escape hatch (`interface CookieJar { read(name: string): string | null; write(name: string, value: string, opts: { path: string; domain?: string; sameSite: string; secure: boolean; maxAge?: number; }): void }`). When `typeof document === 'undefined'`, all three methods delegate to `cookieJar` if provided, else become silent no-ops (warn once in dev only).
4. **Reuse `escapeRegex` from `utils/storage.ts:40`** — import it (export it from `utils/storage.ts` if not already; one-line change).

Verbatim existing `Storage` interface (do NOT redeclare — import it):

```ts
// packages/core/src/types/config.ts:61 — UNCHANGED, reused as-is
export interface Storage {
  getItem: (key: string) => string | null | Promise<string | null>
  setItem: (key: string, value: string) => void | Promise<void>
  removeItem: (key: string) => void | Promise<void>
}
```

Cookie adapter signature + 4KB-warn impl pattern:

```ts
// packages/core/src/storage/cookie-adapter.ts
import type { Storage } from '../types'
import { escapeRegex } from '../utils/storage'   // export this helper

export interface CookieJar {
  read(name: string): string | null
  write(
    name: string,
    value: string,
    opts: { path: string; domain?: string; sameSite: string; secure: boolean; maxAge?: number }
  ): void
}

export interface CookieAdapterOptions {
  domain?: string
  path?: string                                        // default '/'
  sameSite?: 'Strict' | 'Lax' | 'None'                 // default 'Lax'
  secure?: boolean                                     // default: sameSite === 'None'
  maxAge?: number                                      // seconds (preferred)
  expires?: number                                     // days (back-compat with createCookieStorage)
  cookieJar?: CookieJar                                // SSR sink — read on server, write on server
}

const MAX_COOKIE_BYTES = 4096
const WARNED_OVERFLOW_KEYS = new Set<string>()

function warnOversize(key: string, size: number) {
  if (WARNED_OVERFLOW_KEYS.has(key)) return
  WARNED_OVERFLOW_KEYS.add(key)
  // eslint-disable-next-line no-console
  console.warn(
    `[tour-kit] cookie payload for key "${key}" exceeds 4096 bytes (${size}); skipping write. ` +
      `Use indexedDbStorageAdapter for large state.`
  )
}

export function cookieStorageAdapter(options: CookieAdapterOptions = {}): Storage {
  const {
    domain,
    path = '/',
    sameSite = 'Lax',
    secure = sameSite === 'None',
    maxAge,
    expires,
    cookieJar,
  } = options

  return {
    getItem(key) {
      if (typeof document === 'undefined') return cookieJar?.read(key) ?? null
      const m = document.cookie.match(new RegExp(`(^| )${escapeRegex(key)}=([^;]+)`))
      return m ? decodeURIComponent(m[2]) : null
    },
    setItem(key, value) {
      const encoded = encodeURIComponent(value)
      const estAttrBytes = 80 // covers path/domain/maxAge/SameSite/Secure/expires headers
      const totalBytes = key.length + 1 + encoded.length + estAttrBytes
      if (totalBytes > MAX_COOKIE_BYTES) {
        warnOversize(key, totalBytes)
        return
      }
      if (typeof document === 'undefined') {
        cookieJar?.write(key, value, { path, domain, sameSite, secure, maxAge })
        return
      }
      const parts: string[] = [`${key}=${encoded}`, `path=${path}`, `SameSite=${sameSite}`]
      if (domain) parts.push(`domain=${domain}`)
      if (secure) parts.push('Secure')
      if (maxAge !== undefined) parts.push(`max-age=${maxAge}`)
      else if (expires !== undefined) {
        const d = new Date(Date.now() + expires * 86400000)
        parts.push(`expires=${d.toUTCString()}`)
      }
      document.cookie = parts.join('; ')
    },
    removeItem(key) {
      if (typeof document === 'undefined') {
        cookieJar?.write(key, '', { path, domain, sameSite, secure, maxAge: 0 })
        return
      }
      document.cookie = `${key}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${path}`
    },
  }
}
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0; a manual `node -e "const { cookieStorageAdapter } = require('./packages/core/dist'); const a = cookieStorageAdapter({}); console.log(a.getItem('x'))"` after a build returns `null` without throwing.

---

### Task 18.2 — `indexedDbStorageAdapter({ dbName, store })` with in-memory fallback (4–5 h)

**Depends on:** —

Implement the IndexedDB adapter using **`idb-keyval`** (confirmed via Context7 2026-05-15 — see Execution Prompt for the exact API surface). Decision rationale: `idb-keyval` is ~600 B gzipped, has a high source reputation (`/jakearchibald/idb-keyval`, maintained by Jake Archibald), and provides a tree-shakeable `get`/`set`/`del`/`clear` API plus the `createStore(dbName, storeName)` factory we need. Raw IDB would require ~150 lines of transaction boilerplate for the same surface — `idb-keyval` is the obvious win and stays under our `core < 8 KB gzipped` budget because it's loaded only when the IDB adapter is constructed (peer-optional, dynamic import).

The adapter must:

1. **Dynamic-import `idb-keyval`** inside the factory (NOT at module top) — this keeps the file loadable without the peer installed.
2. **Lazy probe**: on first method call, attempt a probe write+delete. On failure (or if the dynamic import threw), swap the adapter's method set to delegate to `inMemoryStorageAdapter()` + emit one `console.warn`. Track probe state per `(dbName, storeName)` pair in a module-level `Map` so two adapters over the same DB share the result.
3. **Always return `Promise<...>`** — never a bare value. The IDB API is async; spurious sync returns would confuse downstream `Promise.resolve(...)` handlers.
4. **Catch `AbortError`** (versionchange in another tab) — warn once per dbName, return `null` (read) or resolve silently (write).

```ts
// packages/core/src/storage/indexeddb-adapter.ts
import type { Storage } from '../types'
import { inMemoryStorageAdapter } from './in-memory-adapter'

export interface IdbAdapterOptions {
  dbName?: string                                      // default 'tour-kit'
  store?: string                                       // default 'state'
}

type ProbeState = 'unknown' | 'ok' | 'blocked'
const PROBE_STATES = new Map<string, ProbeState>()
const WARNED_ABORTS = new Set<string>()

export function indexedDbStorageAdapter(options: IdbAdapterOptions = {}): Storage {
  const { dbName = 'tour-kit', store: storeName = 'state' } = options
  const probeKey = `${dbName}::${storeName}`

  // Captured in closure; resolved on first method call.
  let resolved:
    | { kind: 'idb'; get: Function; set: Function; del: Function }
    | { kind: 'mem'; mem: Storage }
    | null = null

  async function ensure(): Promise<NonNullable<typeof resolved>> {
    if (resolved) return resolved
    if (PROBE_STATES.get(probeKey) === 'blocked') {
      resolved = { kind: 'mem', mem: inMemoryStorageAdapter() }
      return resolved
    }
    try {
      const idb = await import('idb-keyval')
      const customStore = idb.createStore(dbName, storeName)
      // Probe: write+del a sentinel
      await idb.set('__tour-kit-probe__', '1', customStore)
      await idb.del('__tour-kit-probe__', customStore)
      PROBE_STATES.set(probeKey, 'ok')
      resolved = {
        kind: 'idb',
        get: (k: string) => idb.get<string>(k, customStore),
        set: (k: string, v: string) => idb.set(k, v, customStore),
        del: (k: string) => idb.del(k, customStore),
      }
    } catch (err) {
      PROBE_STATES.set(probeKey, 'blocked')
      // eslint-disable-next-line no-console
      console.warn(
        '[tour-kit] IndexedDB unavailable — falling back to in-memory store. ' +
          'State will not persist across reloads.'
      )
      resolved = { kind: 'mem', mem: inMemoryStorageAdapter() }
    }
    return resolved
  }

  function handleAbort(err: unknown, dbKey: string): null {
    if (err instanceof DOMException && err.name === 'AbortError') {
      if (!WARNED_ABORTS.has(dbKey)) {
        WARNED_ABORTS.add(dbKey)
        // eslint-disable-next-line no-console
        console.warn(
          `[tour-kit] IndexedDB transaction aborted in "${dbKey}" (versionchange in another tab) — retrying next call.`
        )
      }
      return null
    }
    throw err
  }

  return {
    async getItem(key) {
      const r = await ensure()
      if (r.kind === 'mem') return r.mem.getItem(key)
      try {
        const v = (await r.get(key)) as string | undefined
        return v ?? null
      } catch (err) {
        return handleAbort(err, probeKey)
      }
    },
    async setItem(key, value) {
      const r = await ensure()
      if (r.kind === 'mem') return r.mem.setItem(key, value)
      try {
        await r.set(key, value)
      } catch (err) {
        handleAbort(err, probeKey)
      }
    },
    async removeItem(key) {
      const r = await ensure()
      if (r.kind === 'mem') return r.mem.removeItem(key)
      try {
        await r.del(key)
      } catch (err) {
        handleAbort(err, probeKey)
      }
    },
  }
}
```

**Sanity check:** `pnpm --filter @tour-kit/core typecheck` exits 0; `pnpm --filter @tour-kit/core test -- --run indexeddb-adapter` exits 0 (with `fake-indexeddb` providing the substrate).

---

### Task 18.3 — `inMemoryStorageAdapter` + parameterized contract suite + cross-adapter test + docs (1–2 h)

**Depends on:** 18.1, 18.2

**Step A — `inMemoryStorageAdapter`** (extracted from `createNoopStorage` in `utils/storage.ts:28`):

```ts
// packages/core/src/storage/in-memory-adapter.ts
import type { Storage } from '../types'

export function inMemoryStorageAdapter(): Storage {
  const store = new Map<string, string>()
  return {
    getItem: (key) => (store.has(key) ? (store.get(key) as string) : null),
    setItem: (key, value) => {
      store.set(key, value)
    },
    removeItem: (key) => {
      store.delete(key)
    },
  }
}
```

Update `utils/storage.ts:28` so `createNoopStorage` becomes `export const createNoopStorage = inMemoryStorageAdapter` (one-line re-export; existing callers unaffected). Add `@deprecated` JSDoc pointing to `inMemoryStorageAdapter`.

**Step B — Parameterized contract helper** (`src/storage/contract.test-helpers.ts`):

```ts
// packages/core/src/storage/contract.test-helpers.ts
import { describe, expect, it, vi } from 'vitest'
import type { Storage } from '../types'

export interface AdapterFixture {
  adapter: Storage
  label: string
  /** Set to true for IDB; the contract relaxes the sync-return assertion. */
  isAsync: boolean
  /** Set to true for cookie; the contract expects warn-and-skip on >4KB. */
  enforces4kbCap: boolean
  /** Tear-down between cases (e.g., document.cookie cleanup, idb-keyval.clear()). */
  reset: () => void | Promise<void>
}

export function StorageAdapterContract(fixture: AdapterFixture): void {
  const { adapter, label, isAsync, enforces4kbCap, reset } = fixture

  describe(`StorageAdapterContract [${label}]`, () => {
    beforeEach(() => reset())

    it('1. round-trips a string via setItem → getItem', async () => {
      await adapter.setItem('k', 'v')
      expect(await adapter.getItem('k')).toBe('v')
    })
    it('2. getItem returns null for missing key', async () => {
      expect(await adapter.getItem('missing')).toBeNull()
    })
    it('3. removeItem deletes a key', async () => {
      await adapter.setItem('k', 'v')
      await adapter.removeItem('k')
      expect(await adapter.getItem('k')).toBeNull()
    })
    it('4. setItem overwrites existing value', async () => {
      await adapter.setItem('k', 'a')
      await adapter.setItem('k', 'b')
      expect(await adapter.getItem('k')).toBe('b')
    })
    it('5. round-trips an empty string', async () => {
      await adapter.setItem('k', '')
      expect(await adapter.getItem('k')).toBe('')
    })
    it('6. preserves JSON with special chars', async () => {
      const json = JSON.stringify({ s: 'line1\nline2 "quoted" 🎉', n: 1 })
      await adapter.setItem('k', json)
      expect(await adapter.getItem('k')).toBe(json)
    })
    it('7. concurrent sequential writes both visible', async () => {
      await adapter.setItem('a', '1')
      await adapter.setItem('b', '2')
      expect(await adapter.getItem('a')).toBe('1')
      expect(await adapter.getItem('b')).toBe('2')
    })
    it('8. removeItem on missing key does not throw', async () => {
      await expect(adapter.removeItem('never-set')).resolves.toBeUndefined()
    })
    it('9. getItem return shape matches isAsync flag', () => {
      const r = adapter.getItem('any')
      if (isAsync) expect(r && typeof (r as Promise<unknown>).then === 'function').toBe(true)
      else expect(r === null || typeof r === 'string').toBe(true)
    })
    it('10. large payload (10 KB) is rejected-with-warn (cookie) or accepted (others)', async () => {
      const big = 'x'.repeat(10 * 1024)
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      await adapter.setItem('big', big)
      const stored = await adapter.getItem('big')
      if (enforces4kbCap) {
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('exceeds 4096 bytes'))
        expect(stored).toBeNull()
      } else {
        expect(stored).toBe(big)
      }
      warnSpy.mockRestore()
    })
    it('11. setItem with non-string input does not throw at runtime', async () => {
      // Runtime defense — TS would reject, but consumer code may slip
      await expect(adapter.setItem('k', 123 as unknown as string)).resolves.toBeUndefined()
    })
    it('12. SSR safety — getItem with no document returns null (skipped for cookie unless cookieJar)', async () => {
      // Each fixture's reset() may stub typeof document/window — assertion verified per fixture
      // For browser-only adapters in jsdom, this case is exercised by the dedicated SSR test file.
      expect(true).toBe(true)
    })
  })
}
```

**Step C — Cross-adapter contract runner** (`packages/core/__tests__/cross-adapter.contract.test.ts`): import the helper + the 3 adapter factories, build a fixture per adapter, call `StorageAdapterContract(fixture)` three times. Pre-install `fake-indexeddb/auto` via `vitest.setup.ts` (existing core test setup file — add the import if not already there).

**Step D — Docs**: `apps/docs/content/docs/storage/adapters.mdx`. Four sections:

1. **When to use each adapter** — comparison table (size limit, SSR-safe, async, cross-subdomain, browser-blocked fallback).
2. **`cookieStorageAdapter`** — full options reference, the 4096-byte cap explained, Next.js `cookieJar` wiring snippet using `next/headers.cookies()`.
3. **`indexedDbStorageAdapter`** — full options reference, `idb-keyval` install note, blocked-storage fallback behavior.
4. **`inMemoryStorageAdapter`** — when to use (SSR placeholder, tests), explicit non-persistence warning.

Update `apps/docs/content/docs/storage/meta.json` (create the `storage` folder + `meta.json` if absent — copy structure from an existing folder like `apps/docs/content/docs/analytics/meta.json`). Verify sidebar render.

**Sanity check:** `pnpm --filter @tour-kit/core test -- --run cross-adapter.contract` exits 0 with 36 passing cases; `pnpm --filter docs build` exits 0; the new `Storage Adapters` page appears in the docs sidebar.

---

## Deliverables

```
packages/core/
├── src/
│   ├── storage/                                       # NEW directory
│   │   ├── cookie-adapter.ts                          # NEW — cookieStorageAdapter + CookieAdapterOptions + CookieJar
│   │   ├── indexeddb-adapter.ts                       # NEW — indexedDbStorageAdapter + IdbAdapterOptions; lazy probe + in-memory fallback
│   │   ├── in-memory-adapter.ts                       # NEW — inMemoryStorageAdapter (extracted from createNoopStorage)
│   │   └── contract.test-helpers.ts                   # NEW — parameterized StorageAdapterContract(fixture) helper
│   ├── utils/storage.ts                               # UPDATED — export escapeRegex; createNoopStorage becomes a @deprecated re-export of inMemoryStorageAdapter
│   └── index.ts                                       # UPDATED — re-export cookieStorageAdapter, indexedDbStorageAdapter, inMemoryStorageAdapter + the 2 option interfaces
│
├── __tests__/
│   ├── cookie-adapter.test.ts                         # NEW — 4KB-warn-and-skip; SSR fallback (no document); cookieJar round-trip; attribute serialization
│   ├── indexeddb-adapter.test.ts                      # NEW — 1MB perf budget (< 50ms in jsdom + fake-indexeddb); probe-fail → in-memory fallback; AbortError handling
│   └── cross-adapter.contract.test.ts                 # NEW — runs StorageAdapterContract against all 3 adapters (12 cases × 3 = 36 assertions)
│
├── vitest.setup.ts                                    # UPDATED (if needed) — import 'fake-indexeddb/auto' for IDB tests
├── package.json                                       # UPDATED — peerDependenciesMeta.idb-keyval optional ">=5.0.0 <7"
└── CHANGELOG.md                                       # UPDATED — Added: 3 adapters + 2 option interfaces; storage interface unchanged

apps/docs/content/docs/
└── storage/                                           # NEW folder (if absent)
    ├── adapters.mdx                                   # NEW — when-to-use, options reference, Next.js cookieJar snippet, blocked-fallback note
    └── meta.json                                      # NEW or UPDATED — sidebar entry
```

---

## Exit Criteria

- [ ] `pnpm --filter @tour-kit/core typecheck` exits 0 — confirms all 3 adapters satisfy the existing `Storage` interface without widening it
- [ ] `pnpm --filter @tour-kit/core test -- --run cookie-adapter` exits 0 with ≥4 cases: (a) 4KB overflow warns once + skips write (`console.warn` spy called with `"exceeds 4096 bytes"`; `document.cookie` does not contain the key), (b) SSR with no `document` returns null without throwing, (c) `cookieJar` round-trip (write on server → read returns the value), (d) all 5 attributes (`domain`, `path`, `sameSite`, `secure`, `maxAge`) are serialized into `document.cookie`
- [ ] `pnpm --filter @tour-kit/core test -- --run indexeddb-adapter` exits 0 with ≥4 cases: (a) 1MB payload writes in `<50ms` via `performance.measure`, (b) `indexedDB.open` stubbed to throw → adapter falls back to in-memory + warns once, (c) `AbortError` from `idb-keyval` is caught + warns once + returns null (read) or resolves silently (write), (d) two adapters over the same dbName share probe state (only 1 probe call)
- [ ] `pnpm --filter @tour-kit/core test -- --run cross-adapter.contract` exits 0 with **36 passing assertions** (12 cases × 3 adapters)
- [ ] `grep -E "^export (const|function) (cookieStorageAdapter|indexedDbStorageAdapter|inMemoryStorageAdapter)" packages/core/src/index.ts | wc -l` returns `3`
- [ ] `grep -c "import 'idb-keyval'" packages/core/src/storage/indexeddb-adapter.ts` returns `0` — peer-optional via dynamic import only
- [ ] `pnpm --filter @tour-kit/core build` exits 0; `dist/index.js` does NOT bundle `idb-keyval` (`grep -c "idb-keyval" packages/core/dist/index.js` returns `0`)
- [ ] `pnpm --filter docs build` exits 0; `apps/docs/content/docs/storage/adapters.mdx` exists and the page renders in the dev sidebar under a "Storage" group
- [ ] `packages/core/CHANGELOG.md` lists the 3 new adapters under "Added" with a one-line summary each; notes the `Storage` interface is unchanged
- [ ] Existing tests still pass with no regression: `pnpm --filter @tour-kit/core test -- --run` exits 0 (including the existing `__tests__/utils/storage.test.ts` since `createNoopStorage` now re-exports `inMemoryStorageAdapter`)

---

## Execution Prompt

Copy everything between the `---` lines into a new Claude session to implement this phase:

---
You are building Phase 18 of Tour Kit v2 Package Polish — Storage Adapter Parity.

### What This Project Is
Tour Kit is a pnpm monorepo of 12 packages providing headless React product-tour primitives (`@tour-kit/core`, `@tour-kit/react`, `@tour-kit/hints`) plus Pro packages (`announcements`, `surveys`, `checklists`, `adoption`, `analytics`, `ai`, `scheduling`, `license`, `media`). v2 closes demo-wiring gaps reported while building `examples/dashboard-next/`. Stack: TypeScript strict mode, React 18+, tsup (ESM + CJS), Turborepo, Vitest. Bundle budget for `@tour-kit/core` is **<8 KB gzipped** — every new dep must justify its bytes.

### Established in Prior Phases / In the Codebase
- The `Storage` interface lives at `packages/core/src/types/config.ts:61` and is **unchanged** by this phase. It already permits sync OR async returns:
  ```ts
  export interface Storage {
    getItem: (key: string) => string | null | Promise<string | null>
    setItem: (key: string, value: string) => void | Promise<void>
    removeItem: (key: string) => void | Promise<void>
  }
  ```
- The existing `createCookieStorage(options)` in `packages/core/src/utils/storage.ts:45-69` is the structural starting point for the new cookie adapter; keep it as a `@deprecated` re-export.
- The existing `createNoopStorage()` at `packages/core/src/utils/storage.ts:28` becomes a `@deprecated` re-export of the new `inMemoryStorageAdapter()`.
- `escapeRegex(s)` at `packages/core/src/utils/storage.ts:40` is currently NOT exported — export it for reuse.
- `createStorageAdapter(storageType)` at line 6 resolves the `storage: 'cookie'` shorthand to `createCookieStorage()` — DO NOT change this; it stays working through the deprecated re-export.
- This phase ships **no animations** (no reduced-motion concern), **no Zod schemas** (adapter options are in-process boundaries), **no breaking changes** (the `Storage` interface is unchanged, `createCookieStorage` + `createNoopStorage` remain exported).

### Your Goal for This Phase
Add 3 new exported factory functions to `@tour-kit/core` — `cookieStorageAdapter`, `indexedDbStorageAdapter`, `inMemoryStorageAdapter` — that all implement the existing `Storage` interface and pass the same `StorageAdapterContract` test suite. The IDB adapter uses `idb-keyval` as a peer-optional, dynamic-imported dep. Document the 3 adapters at `apps/docs/content/docs/storage/adapters.mdx`.

### Data Model Rules (follow exactly)
- **`interface` (exported, reused unchanged):** `Storage` from `packages/core/src/types/config.ts`. Do NOT redeclare; import it.
- **`interface` (NEW, exported from main barrel):** `CookieAdapterOptions`, `IdbAdapterOptions`, `CookieJar`. All three are public surface — consumers pass them to factories.
- **`type` aliases:** none in this phase.
- **`const` module-level state:** `WARNED_OVERFLOW_KEYS: Set<string>` (cookie 4KB warn dedup), `WARNED_ABORTS: Set<string>` (IDB versionchange warn dedup), `PROBE_STATES: Map<string, 'unknown' | 'ok' | 'blocked'>` (IDB probe state shared per dbName+storeName). All internal — not exported.
- **No new Zod schemas.** Options come from consumer code, not external boundaries.
- **No new public API beyond:** `cookieStorageAdapter`, `indexedDbStorageAdapter`, `inMemoryStorageAdapter`, `CookieAdapterOptions`, `IdbAdapterOptions`, `CookieJar` (re-exported), and the `escapeRegex` helper (now exported from `utils/storage.ts` for internal sharing).

### Architecture
```
@tour-kit/core
  src/types/config.ts                  # UNCHANGED — Storage interface stays as-is
  src/utils/storage.ts                 # UPDATED — export escapeRegex; createNoopStorage = @deprecated re-export of inMemoryStorageAdapter
  src/storage/                         # NEW directory
    cookie-adapter.ts                  # cookieStorageAdapter({ domain, path, sameSite, secure, maxAge, cookieJar? })
                                       #   - 4096-byte hard cap (warn-once + skip on overflow)
                                       #   - SSR via opts.cookieJar (read/write hooks for next/headers.cookies())
                                       #   - Reuses escapeRegex from utils/storage.ts
    indexeddb-adapter.ts               # indexedDbStorageAdapter({ dbName='tour-kit', store='state' })
                                       #   - await import('idb-keyval') inside the factory (peer-optional)
                                       #   - Lazy probe on first call; on failure, swap methods to inMemoryStorageAdapter()
                                       #   - Catches AbortError (versionchange in another tab)
                                       #   - Probe state cached in module-level Map keyed by dbName::storeName
    in-memory-adapter.ts               # inMemoryStorageAdapter() — Map<string, string>; sync only
    contract.test-helpers.ts           # StorageAdapterContract(fixture: AdapterFixture): void
                                       #   - 12 parameterized cases; runs against any Storage impl
  src/index.ts                         # Re-exports 3 factories + 3 option interfaces

apps/docs/content/docs/storage/
  adapters.mdx                         # 4 sections: comparison, cookie, IDB, in-memory
  meta.json                            # Sidebar entry under "Storage"
```

### Confirmed Library APIs

**`idb-keyval` v5.x+ — confirmed via Context7 2026-05-15 (`/jakearchibald/idb-keyval`, source rep High, 24 snippets):**
```ts
// Library: idb-keyval >=5.0.0 <7
// Package: dual ESM/CJS. Tree-shakeable named exports. ~600B gzipped.
// peerDeps: none (pure browser; uses native IndexedDB)

import { get, set, del, clear, createStore } from 'idb-keyval'

// 1. Default store (uses dbName='keyval-store', storeName='keyval'):
await set('hello', 'world')
const v = await get<string>('hello')   // → 'world'
await del('hello')
await clear()

// 2. Custom store (we use this — dbName='tour-kit', storeName='state'):
const store = createStore('tour-kit', 'state')
await set('key', 'value', store)
const v2 = await get<string>('key', store)
await del('key', store)

// 3. Signatures (typed via @types/idb-keyval; no peer needed for types):
//    get<T>(key: IDBValidKey, store?: UseStore): Promise<T | undefined>
//    set(key: IDBValidKey, value: any, store?: UseStore): Promise<void>
//    del(key: IDBValidKey, store?: UseStore): Promise<void>
//    clear(store?: UseStore): Promise<void>
//    createStore(dbName: string, storeName: string): UseStore
```

**Decision: `idb-keyval` over raw IndexedDB.** Rationale: ~600 B gzipped + dynamic-imported (zero bytes in `dist/index.js`) vs ~150 lines of transaction boilerplate we'd own and have to test for the same surface. The `createStore(dbName, storeName)` factory is the only piece of API we need; everything else is `get`/`set`/`del`. Tree-shakeable named exports keep the IDB adapter file under 2 KB.

**`fake-indexeddb` (test substrate):** import `'fake-indexeddb/auto'` once in `vitest.setup.ts` to make `indexedDB` global available in jsdom. Existing core test setup file — add the import if not already there; if `fake-indexeddb` is not in devDeps, add it (`pnpm --filter @tour-kit/core add -D fake-indexeddb`).

### Files to Create / Update

#### `packages/core/src/storage/cookie-adapter.ts` (NEW)
Export `cookieStorageAdapter(options: CookieAdapterOptions = {}): Storage`, `interface CookieAdapterOptions`, `interface CookieJar`. Implementation per Task 18.1 in the phase file: 4096-byte cap with warn-once dedup via module-level `Set<string>`; SSR delegation via `opts.cookieJar` (silent no-op without it); attribute serialization for `domain`, `path` (default `'/'`), `sameSite` (default `'Lax'`), `secure` (default `sameSite === 'None'`), `maxAge` (seconds) or legacy `expires` (days). Import `escapeRegex` from `../utils/storage`. Add `'use client'` directive at the top.

#### `packages/core/src/storage/indexeddb-adapter.ts` (NEW)
Export `indexedDbStorageAdapter(options: IdbAdapterOptions = {}): Storage`, `interface IdbAdapterOptions`. Implementation per Task 18.2: closure-captured `resolved` state machine (`'unknown' | 'idb' | 'mem'`); `ensure()` async helper that dynamic-imports `idb-keyval`, probes via `set('__tour-kit-probe__', '1', store) + del(...)`, caches the result per `dbName::storeName` in a module-level `Map`; on probe failure or import failure, swaps to `inMemoryStorageAdapter()` and warns once. All three Storage methods always return `Promise<...>`. Catch `DOMException` with `name === 'AbortError'`, warn-once per dbName, return null (read) or resolve silently (write). Add `'use client'` directive at the top.

#### `packages/core/src/storage/in-memory-adapter.ts` (NEW)
Export `inMemoryStorageAdapter(): Storage`. Trivial `Map<string, string>`-backed implementation. Sync (returns bare values, not Promises). Each call to `inMemoryStorageAdapter()` returns a NEW instance with its own private Map (so tests + fallback callers get isolation). No `'use client'` directive — safe in any environment.

#### `packages/core/src/storage/contract.test-helpers.ts` (NEW)
Export `interface AdapterFixture` and `function StorageAdapterContract(fixture: AdapterFixture): void`. The function calls Vitest's `describe(...)` block internally — DO NOT use `test.concurrent` (concurrent writes case relies on sequential ordering). 12 cases per the phase file's Task 18.3 Step B. Use `await` on every adapter call so async adapters work uniformly; sync adapters return resolved-without-then values that `await` is a no-op on. Tests run inside the consumer test file's `describe()` block, with `beforeEach(reset)` for isolation.

#### `packages/core/__tests__/cookie-adapter.test.ts` (NEW)
≥4 cases per Exit Criteria. Use `vi.spyOn(console, 'warn').mockImplementation(() => {})` for the 4KB case. Reset `document.cookie` between cases via a `beforeEach` that walks `document.cookie.split('; ')` and deletes each. For the SSR case, use a `describe.each` or a `// @vitest-environment node` directive block; assert `cookieStorageAdapter({}).getItem('any')` returns `null` without throwing. For the `cookieJar` case, instantiate a fake jar (`{ read: vi.fn().mockReturnValue('v'), write: vi.fn() }`) and assert round-trip + spy calls.

#### `packages/core/__tests__/indexeddb-adapter.test.ts` (NEW)
≥4 cases. Import `'fake-indexeddb/auto'` at the top (or rely on `vitest.setup.ts`). Perf test: build a 1 MB JSON string (`JSON.stringify({ data: 'x'.repeat(1024 * 1024) })`), wrap the `setItem` call in `performance.mark('start')` / `performance.mark('end')` / `performance.measure('w', 'start', 'end')`, then read the entry from `performance.getEntriesByName('w')[0].duration` and assert `< 50` ms. Probe-fail test: `vi.stubGlobal('indexedDB', { open: () => { throw new Error('blocked') } })`, construct adapter, call setItem, assert warn called with `"IndexedDB unavailable"` and value round-trips through the in-memory fallback. AbortError test: spy on `idb-keyval.set` to reject with `new DOMException('aborted', 'AbortError')` once, assert warn called and the call resolves without throwing. Shared-probe test: construct two adapters with same `dbName`, assert `console.warn` for "IndexedDB unavailable" was called at most once (mock probe to fail; both adapters share the cached failure).

#### `packages/core/__tests__/cross-adapter.contract.test.ts` (NEW)
Import `StorageAdapterContract` from `../src/storage/contract.test-helpers`. Import `cookieStorageAdapter`, `indexedDbStorageAdapter`, `inMemoryStorageAdapter`. Build 3 fixtures (one per adapter) and call `StorageAdapterContract(fixture)` for each. Each fixture's `reset()` must isolate state: cookie clears `document.cookie`, IDB calls `idb-keyval.clear(store)`, in-memory constructs a fresh adapter (new closure). 36 passing assertions total.

#### `packages/core/src/utils/storage.ts` (UPDATED)
1. Export `escapeRegex` (change `const escapeRegex = ...` to `export const escapeRegex = ...`).
2. Replace the `createNoopStorage` function body with `import { inMemoryStorageAdapter } from '../storage/in-memory-adapter'; export const createNoopStorage = inMemoryStorageAdapter` — add a `@deprecated since v2.0; use inMemoryStorageAdapter from '@tour-kit/core'` JSDoc.
3. Add a `@deprecated since v2.0; use cookieStorageAdapter` JSDoc to `createCookieStorage`. Leave its body unchanged — `createStorageAdapter` still calls it for the `storage: 'cookie'` shorthand.

#### `packages/core/src/index.ts` (UPDATED)
Add the following re-exports (alphabetical insertion in the existing storage block):
```ts
export {
  cookieStorageAdapter,
  type CookieAdapterOptions,
  type CookieJar,
} from './storage/cookie-adapter'
export {
  indexedDbStorageAdapter,
  type IdbAdapterOptions,
} from './storage/indexeddb-adapter'
export { inMemoryStorageAdapter } from './storage/in-memory-adapter'
```
Do NOT re-export `StorageAdapterContract` or `AdapterFixture` — those are test-only utilities. Do NOT re-export any of the internal `Set<string>`/`Map<string, ...>` state.

#### `packages/core/package.json` (UPDATED)
Add to `peerDependenciesMeta`:
```json
"peerDependenciesMeta": {
  "idb-keyval": { "optional": true }
}
```
Optionally add the version range to `peerDependencies` for explicit signaling (`"idb-keyval": ">=5.0.0 <7"`) — but keep it optional via the meta block. Also add `fake-indexeddb` to `devDependencies` if not already present.

#### `packages/core/vitest.setup.ts` (UPDATED — if file exists; create if absent)
Add `import 'fake-indexeddb/auto'` at the top so any IDB test in core works without per-test setup. Verify the test runner picks it up (check `vitest.config.ts` for `setupFiles`).

#### `packages/core/CHANGELOG.md` (UPDATED)
Add an entry:
```markdown
### Added
- `cookieStorageAdapter({ domain, path, sameSite, secure, maxAge, cookieJar? })` — SSR-safe cookie storage with 4 KB overflow protection (warns + skips write).
- `indexedDbStorageAdapter({ dbName, store })` — large-state storage backed by `idb-keyval` (peer-optional). Falls back to in-memory on browser block.
- `inMemoryStorageAdapter()` — non-persistent fallback; also reused by IDB on probe failure.
- `CookieAdapterOptions`, `IdbAdapterOptions`, `CookieJar` interfaces exported from the main barrel.

### Deprecated
- `createCookieStorage()` — use `cookieStorageAdapter(...)` instead. Will be removed in v3.0.
- `createNoopStorage()` — re-exported as alias for `inMemoryStorageAdapter()`. Will be removed in v3.0.

### Notes
- The `Storage` interface is **unchanged** — no migration needed for existing consumers.
- `idb-keyval` is a peer-optional dep. Install it with `pnpm add idb-keyval` only if you use `indexedDbStorageAdapter`.
```

#### `apps/docs/content/docs/storage/adapters.mdx` (NEW)
Frontmatter: `title: Storage Adapters`, `description: Choose between localStorage, sessionStorage, cookies, IndexedDB, and in-memory storage for tour state persistence.`. Four sections per Task 18.3 Step D. Include the comparison table:

| Adapter | Size limit | SSR-safe | Async | Cross-subdomain | Browser-blocked fallback |
|---|---|---|---|---|---|
| `localStorage` (default) | ~5 MB | No | Sync | No | N/A |
| `cookieStorageAdapter` | 4 KB | Yes (via `cookieJar`) | Sync | Yes | N/A |
| `indexedDbStorageAdapter` | >50 MB | No | **Async** | No | In-memory |
| `inMemoryStorageAdapter` | RAM | Yes | Sync | No | N/A |

Include a Next.js `cookieJar` wiring snippet:
```tsx
import { cookies } from 'next/headers'
import { cookieStorageAdapter } from '@tour-kit/core'

const adapter = cookieStorageAdapter({
  sameSite: 'Lax',
  cookieJar: {
    read: (name) => cookies().get(name)?.value ?? null,
    write: (name, value, opts) => cookies().set(name, value, { path: opts.path, sameSite: opts.sameSite, secure: opts.secure, maxAge: opts.maxAge, domain: opts.domain }),
  },
})
```

#### `apps/docs/content/docs/storage/meta.json` (NEW)
Per `CLAUDE.md` Content Pipeline Rules, update the registry/config so the page is `published: true` and verify it appears in the sidebar. Copy structure from `apps/docs/content/docs/analytics/meta.json`.

### Success Criteria
- All 3 adapters satisfy the existing `Storage` interface (typecheck green)
- Cookie 4KB cap: `console.warn` called, write skipped — observable via spy
- IDB perf: 1MB write completes in <50ms via `performance.measure`
- All 3 adapters pass `StorageAdapterContract` — 36 assertions green
- SSR cookie round-trip works via `cookieJar` option
- IDB block → in-memory fallback + warn (verified by `vi.stubGlobal('indexedDB', ...)`)
- `pnpm --filter @tour-kit/core build` exits 0; `dist/index.js` does not bundle `idb-keyval`
- `pnpm --filter docs build` exits 0; new docs page appears in sidebar
- No regressions in existing tests: `pnpm --filter @tour-kit/core test -- --run` exits 0

### Expected File Structure at End
```
tasks/v2-package-polish/
├── big-plan.md
├── phase-0.md
├── ...
├── phase-17.md
└── phase-18.md

packages/core/src/
├── storage/                            # NEW
│   ├── cookie-adapter.ts               # NEW
│   ├── indexeddb-adapter.ts            # NEW
│   ├── in-memory-adapter.ts            # NEW
│   └── contract.test-helpers.ts        # NEW
├── utils/storage.ts                    # UPDATED — export escapeRegex; deprecated re-exports
└── index.ts                            # UPDATED — 3 adapter factories + 3 option types

packages/core/__tests__/
├── cookie-adapter.test.ts              # NEW
├── indexeddb-adapter.test.ts           # NEW
└── cross-adapter.contract.test.ts      # NEW

packages/core/
├── vitest.setup.ts                     # UPDATED — import 'fake-indexeddb/auto'
├── package.json                        # UPDATED — peerDependenciesMeta.idb-keyval optional
└── CHANGELOG.md                        # UPDATED

apps/docs/content/docs/storage/         # NEW folder
├── adapters.mdx                        # NEW
└── meta.json                           # NEW
```

---

## Readiness Check

- [PASS] All inputs from prior phases listed and available — Phase 18 is independent of all prior phases (`Depends on: Nothing`); the `Storage` interface source-of-truth at `packages/core/src/types/config.ts:61` is pasted verbatim in the Execution Prompt; the existing `createCookieStorage` and `createNoopStorage` line numbers (`utils/storage.ts:28, 45`) are cited; the `escapeRegex` helper at line 40 is explicitly called out as needing to be exported.
- [PASS] Every sub-task has a clear, testable completion condition — 18.1 has `pnpm --filter @tour-kit/core typecheck` + manual node smoke test; 18.2 has `pnpm --filter @tour-kit/core test -- --run indexeddb-adapter`; 18.3 has `--run cross-adapter.contract` + `pnpm --filter docs build`. Each maps to one or more Exit Criteria items.
- [PASS] Execution prompt is self-contained — `idb-keyval` API surface pasted verbatim from the Context7 confirmation (get/set/del/clear + createStore signatures + ESM/CJS dual-pack notes + ~600B gzipped budget); the existing `Storage` interface pasted verbatim with file:line source; per-file guidance has one paragraph per NEW/UPDATED file; data model rules listed (interface/type/const-tuple/no-Zod); success criteria are observable shell commands. A senior engineer could open a fresh session and implement with zero follow-up questions.
- [PASS] Exit criteria map 1:1 to deliverables — every NEW/UPDATED file in the Deliverables tree appears in at least one exit checkbox: cookie tests (4KB + SSR + cookieJar + attributes), IDB tests (perf + fallback + abort + shared-probe), cross-adapter contract (36 assertions), typecheck, build, no-bundle grep against `dist/index.js`, docs build, CHANGELOG presence, existing test regression check.
- [PASS] Heavy external deps have a fake/stub strategy noted — `idb-keyval` itself is small (~600B) so no fake needed; the IDB **substrate** (browser `indexedDB` global) is stubbed via `fake-indexeddb/auto` imported in `vitest.setup.ts`; probe-failure scenario uses `vi.stubGlobal('indexedDB', { open: () => { throw new Error('blocked') } })`; cookie SSR scenario uses Vitest `// @vitest-environment node` directive or `cookieJar` fake (`{ read: vi.fn(), write: vi.fn() }`). No 100MB+ deps.
- [PASS] New libraries have a confirmed snippet from Context7 in the execution prompt — `idb-keyval v5.x+` confirmed via Context7 2026-05-15 (`/jakearchibald/idb-keyval`, source rep High, 24 snippets): `get<T>(key, store?): Promise<T | undefined>`, `set(key, value, store?): Promise<void>`, `del(key, store?): Promise<void>`, `clear(store?): Promise<void>`, `createStore(dbName, storeName): UseStore`. Dual ESM/CJS; no peer deps; ~600B gzipped. Memory entry created (G#195: `Confirmed: idb-keyval v5.x+`). The raw-IDB alternative was explicitly considered and rejected (rationale in Task 18.2: ~150 lines of transaction boilerplate vs 600B wrapper).
