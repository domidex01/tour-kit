# Spike 0.1 — BroadcastChannel in Vitest jsdom

**Date:** 2026-05-02
**Owner:** domidex01
**Phase:** 1.0 (Validation Gate)

---

## Environment

| Field | Value |
| --- | --- |
| Repo Node (local) | `v24.2.0` |
| Node in CI | `20` (pinned in `.github/workflows/ci.yml:34`, `release.yml:31`, `size-limit.yml:27`, `smoke-npm.yml:37`) |
| Vitest version | `4.1.2` (catalog `^4.1.0` in `pnpm-workspace.yaml:9`) |
| Test environment | `jsdom` (`packages/core/vitest.config.ts:6`) |
| Setup files | `vitest.setup.ts`, `src/__tests__/setup.ts` (no BroadcastChannel mock) |

## Native availability check

```bash
$ node -e "console.log(typeof BroadcastChannel, process.version)"
function v24.2.0
```

`BroadcastChannel` is a native global on Node ≥18 and is exposed by Vitest's jsdom environment without any polyfill or stub.

## Smoke test

File: `packages/core/src/__tests__/spikes/broadcast-smoke.test.ts` (1 test, throwaway).

```bash
$ pnpm --filter @tour-kit/core test spikes/broadcast-smoke

 RUN  v4.1.2 /home/domidex/projects/tour-kit/packages/core

 Test Files  1 passed (1)
      Tests  1 passed (1)
   Start at  09:55:50
   Duration  1.86s
```

The test:
1. Asserts `typeof BroadcastChannel === 'function'`.
2. Constructs two channels with the same name (`'tk-spike'`).
3. Posts a structured payload from A; awaits an async `'message'` event on B.
4. Asserts the received payload equals the sent payload.

Both `addEventListener('message', …)` and `postMessage(…)` work without fake timers.

## Verdict

**Native `BroadcastChannel` works in Vitest jsdom — no polyfill needed.**

- Phase 1.1 (flow session) and Phase 1.5 (cross-tab) can rely on the browser-standard API directly.
- **Do NOT add `pubkey/broadcast-channel`** — it is ~6 KB and would blow the `core` size budget.
- Fallback only if a future jsdom upgrade drops the API: `vi.stubGlobal('BroadcastChannel', class { … })` in `src/__tests__/setup.ts`, or the dev-only `vitest-broadcast-channel-mock` package.

## Cleanup

The smoke test lives at `packages/core/src/__tests__/spikes/broadcast-smoke.test.ts` and **must be deleted before the first Phase 1.x feature PR merges** (Phase 0 fail-safe #1).

---

Decision: GO
