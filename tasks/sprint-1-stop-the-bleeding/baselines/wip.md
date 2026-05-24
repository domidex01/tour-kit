# Sprint 1 — Pre-existing WIP / known-red state

> Captured during Phase 0 pre-flight on 2026-05-24. Anything listed here was already broken on `main` before Sprint 1 began. These are **not** Sprint 1's bugs to fix — Sprint 1 only carries the WIP forward.

## Pre-existing test failures

The `pnpm test --filter='./packages/*'` baseline (`baselines/test-run.log`) has **2 failing tests** in **1 file** in **1 package**. All other 19 package test runs are green.

### Whitelist — exact failures present at baseline

```
@tour-kit/license#test
  src/__tests__/license-test-mode.integration.test.tsx
    × <LicenseTestMode> integration > tier="invalid" → useIsPro() false + watermark present   (5111ms — timed out at 5000ms)
    × <LicenseTestMode> integration > tier="pro" → useIsPro() true                            (5636ms — timed out at 5000ms)
```

Top-level summary in the log:
```
Test Files  1 failed | 18 passed (19)
Tests       2 failed | 175 passed (177)
```

### Why they're skipped for Sprint 1

The failures are integration tests against a real timer + SSR boundary in `@tour-kit/license` that time out at vitest's default 5 s. They predate Sprint 1 — `fix/license-ssr-gate` already has a candidate fix in flight (see memory #41/#43 about main-drift patterns).

Sprint 1's scope is bundle bleeding + hygiene; rewriting the license SSR gate timing is out of scope. The Phase 7 (size-limit / CI alignment) work or a separate license-SSR PR owns this.

### What `verify-baselines.sh` does about it

The asserter's `baseline test-run` gate is whitelisted to accept **exactly** this failure set (`@tour-kit/license#test`). If any other package shows up as `Failed:` in the log, the gate trips — that would be a new regression introduced during Sprint 1, not a pre-existing WIP.

## Pre-existing build/runtime warnings (non-blocking)

- Multiple `@tour-kit/license:build` warnings about `"use client"` directives being dropped when bundling CJS output. Pre-existing; not Sprint 1's scope.
- `.npmrc` `NPM_TOKEN` env-replacement warning on every pnpm invocation. Pre-existing; resolved by setting `NPM_TOKEN` in the shell or removing the placeholder.
- `act(...)` warnings in `@tour-kit/testing-library` tests — output noise, not failures.

## Pre-existing red gates outside `pnpm test`

None currently. `pnpm exec size-limit` exits 0 against the pre-Sprint config (the budgets are simply too loose; Phase 7 tightens them).
