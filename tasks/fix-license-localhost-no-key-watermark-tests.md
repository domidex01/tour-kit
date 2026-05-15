# Test Plan: localhost no-key should be unlicensed

**Companion:** [fix-license-localhost-no-key-watermark.md](./fix-license-localhost-no-key-watermark.md)  
**Primary package:** `@tour-kit/license`  
**Scope:** Vitest unit tests, React/jsdom integration tests, Playwright E2E parity for the license test apps  
**Status:** Planned

---

## Contract to lock

1. Empty or whitespace-only `licenseKey` is unlicensed on every host, including `localhost`, `127.0.0.1`, and `*.local`.
2. A non-empty key on a local dev host still uses `dev_bypass`, skips Polar, and consumes no activation slot.
3. The exported `validateLicenseKey()` headless API matches `<LicenseProvider>` for the missing-key path.
4. Provider state wins over hostname for `useLicenseGate()` and `<ProGate>`.
5. `<LicenseGate>` without a provider stays quiet on local dev hosts because there is no key to inspect.
6. Pro package E2E behavior is a soft gate: the UI renders and one global watermark appears when unlicensed. Do not assert per-package hard placeholders unless the test explicitly renders `<ProGate>`.

---

## Coverage matrix

| Behavior | Unit / integration coverage | E2E coverage |
| --- | --- | --- |
| Missing key on local dev becomes `invalid/free` | `license-provider.test.tsx`, `polar-client.test.ts`, `use-license-gate.test.tsx`, `license-gate.test.tsx`, `pro-gate.test.tsx` | `e2e/{next,vite}/localhost-bypass.spec.ts` empty-key case |
| Non-empty key on local dev returns `dev_bypass` | `license-provider.test.tsx`, `polar-client.test.ts`, `use-license-gate.test.tsx`, `license-gate.test.tsx` | `e2e/{next,vite}/localhost-bypass.spec.ts` valid/invalid-key local cases |
| Missing key skips fetch/cache | `polar-client.test.ts`, `license-provider.test.tsx` | Not needed |
| Whitespace key is missing | `license-state.test.ts`, `license-provider.test.tsx`, `polar-client.test.ts` | Not needed |
| Trimmed non-empty key is used consistently | `license-state.test.ts`, `polar-client.test.ts` | Not needed |
| No-provider localhost remains quiet | Existing `license-gate.test.tsx`; add `use-license-gate.test.tsx`; existing `pro-gate.test.tsx` | `localhost-bypass.spec.ts` no-provider case |
| Production-like unlicensed soft gate | `license-gate.test.tsx` | production `invalid-key`, `empty-key`, and `no-provider` specs |

---

## Test files

### New

- `packages/license/src/__tests__/license-state.test.ts`
  - Direct tests for the new helper module from the implementation plan.
  - No mocks.

- `packages/license/src/__tests__/use-license-gate.test.tsx`
  - Focused branch coverage for provider/no-provider and dev/non-dev combinations.

### Edited

- `packages/license/src/__tests__/license-provider.test.tsx`
  - Replace the current dev-bypass test that passes `licenseKey=""`.

- `packages/license/src/__tests__/polar-client.test.ts`
  - Split the current localhost dev-bypass test into missing-key and non-empty-key cases.

- `packages/license/src/__tests__/license-gate.test.tsx`
  - Add provider-backed localhost empty-key watermark coverage.

- `packages/license/src/__tests__/pro-gate.test.tsx`
  - Add provider-backed localhost empty-key placeholder coverage because `<ProGate>` uses `useLicenseGate()`.

- `e2e/fixtures/license-test-page.ts`
  - Add watermark helpers and stop treating soft-gated pro package UI as hard placeholders.

- `e2e/{next,vite}/localhost-bypass.spec.ts`
  - Move `empty key` out of the bypass loop and assert watermark visibility.

- `e2e/{next,vite}/production-empty-key.spec.ts`
  - Update from hard-placeholder assertions to soft-gate + watermark assertions.

- `e2e/{next,vite}/production-invalid-key.spec.ts`
  - Same soft-gate + watermark cleanup. This is adjacent, but the current assertion is stale for the package's soft-gate contract.

- `e2e/{next,vite}/production-no-provider.spec.ts`
  - Same soft-gate + watermark cleanup.

- `e2e/{next,vite}/placeholder-ui.spec.ts`
  - Either remove these specs or rename/rewrite them as watermark UI specs. The current placeholder checks only apply to `<ProGate>`, not to the pro packages rendered by the license test apps.

---

## Unit test details

### `license-state.test.ts`

Test the pure helper module expected by the implementation plan:

- `normalizeLicenseKey('  TOURKIT_key  ')` returns `'TOURKIT_key'`.
- `normalizeLicenseKey('\tTOURKIT_key\n')` trims tab/newline whitespace.
- `normalizeLicenseKey('\u00a0TOURKIT_key\u00a0')` trims non-breaking spaces if supported by `String.prototype.trim()`.
- `hasLicenseKey('')`, `'   '`, and `'\t\n'` return `false`.
- `hasLicenseKey('TOURKIT_key')` returns `true`.
- `createUnlicensedState(123)` returns exact `invalid/free` shape, `validatedAt: 123`, and `renderKey: undefined`.
- `createDevBypassState(456)` returns exact `valid/pro` shape, `validatedAt: 456`, and `renderKey: 'dev_bypass'`.

Keep these deterministic by passing `now` explicitly.

### `license-provider.test.tsx`

Existing mock strategy is correct:

```ts
vi.mock('../lib/polar-client', () => ({ validateLicenseKey: vi.fn() }))
vi.mock('../lib/domain', () => ({
  isDevEnvironment: vi.fn(),
  getCurrentDomain: vi.fn().mockReturnValue('example.com'),
}))
vi.mock('../lib/cache', () => ({
  clearCache: vi.fn(),
  hasFreshCache: vi.fn().mockReturnValue(false),
}))
```

Replace the current test named `skips validation in dev mode and returns valid pro with dev_bypass renderKey`.

Add:

- `localhost + empty key returns invalid/free and never calls validateLicenseKey`
  - `mockIsDev.mockReturnValue(true)`
  - render `<LicenseProvider licenseKey="">`
  - wait for `status: invalid`, `tier: free`, `renderKey: undefined`
  - assert `mockValidate` not called
  - assert `onValidate` receives `status: invalid`, `tier: free`, `renderKey: undefined`

- `localhost + whitespace-only key is treated as missing`
  - use `it.each(['   ', '\t\n'])`
  - assert invalid/free and no `mockValidate`

- `localhost + non-empty key returns dev_bypass and never calls validateLicenseKey`
  - `licenseKey="TOURKIT_local"`
  - assert `valid/pro`, `renderKey: dev_bypass`, no `mockValidate`

- `production-like host + empty key returns invalid/free and never calls validateLicenseKey`
  - `mockIsDev.mockReturnValue(false)`
  - assert invalid/free and no `mockValidate`

If adding a test consumer for derived gate state is simpler than a separate hook test, expose `isGated` and `isLoading` in the local `TestConsumer`. Otherwise keep gate assertions in `use-license-gate.test.tsx`.

### `polar-client.test.ts`

Do not mock `../lib/domain` in this file. It should keep exercising the real hostname logic through `vi.stubGlobal('location', { hostname })`.

Split the existing `returns dev bypass state in dev environment` test into:

- `missing key on localhost returns invalid/free without fetch or cache write`
  - hostname `localhost`
  - call `validateLicenseKey('', 'org_test_456')`
  - assert `status: invalid`, `tier: free`, `renderKey: undefined`
  - assert `mockFetch` not called
  - assert `localStorage.setItem` not called

- `whitespace key on localhost returns invalid/free without fetch or cache write`
  - same assertions with `'   '`

- `missing key on production-like host returns invalid/free before cache read`
  - hostname `example.com`
  - seed a valid cache entry first
  - call `validateLicenseKey('', 'org_test_456')`
  - assert invalid/free, not cached valid
  - assert `mockFetch` not called

- `non-empty key on localhost returns dev_bypass without fetch`
  - hostname `localhost`
  - call `validateLicenseKey('TOURKIT_local', 'org_test_456')`
  - assert `valid/pro`, `renderKey: dev_bypass`, no `mockFetch`

- `production validation uses trimmed key`
  - hostname `example.com`
  - call `validateLicenseKey('  TK-XXXX  ', 'org_test_456')`
  - assert fetch body has `"key": "TK-XXXX"`
  - assert cache write uses the same trimmed-key hash behavior by reading the stored JSON and verifying `keyHash` equals the hash for `TK-XXXX`, not the raw spaced string. If the hash function stays private, assert by switching to the trimmed key and getting a cache hit in a second call.

Avoid exact `validatedAt` assertions. Use `expect.any(Number)` or compare to the injected `now` only in pure helper tests.

### `use-license-gate.test.tsx`

Use the same mocks as provider tests. Add a tiny `renderHook` wrapper helper.

Cases:

- provider + empty key + dev host -> eventually `{ isGated: true, isLoading: false }`
- provider + whitespace key + dev host -> eventually `{ isGated: true, isLoading: false }`
- provider + non-empty key + dev host -> eventually `{ isGated: false, isLoading: false }`
- no provider + dev host -> immediately `{ isGated: false, isLoading: false }`
- no provider + non-dev host -> immediately `{ isGated: true, isLoading: false }`

This file exists to protect the important refactor: context must be read before the dev-host bypass.

### `license-gate.test.tsx`

Add:

- provider + empty key + localhost renders children and one watermark
  - `mockIsDev.mockReturnValue(true)`
  - render `<LicenseProvider licenseKey=""><LicenseGate require="pro">...`
  - wait for child and `[data-tourkit-watermark]`

- provider + whitespace key + localhost renders children and one watermark

- provider + non-empty key + localhost renders children and no watermark

- provider + empty key + localhost + explicit `fallback` renders fallback and no watermark
  - This locks existing `<LicenseGate fallback>` semantics for the new missing-key path.

Keep the existing `outside LicenseProvider on a dev host (no badge)` test green.

### `pro-gate.test.tsx`

Add:

- provider + empty key + localhost renders the hard placeholder
  - This protects `<ProGate>` consumers after `useLicenseGate()` is changed.

- provider + non-empty key + localhost renders children

Keep existing no-provider dev/non-dev tests.

---

## E2E details

### Fixture helpers

Update `e2e/fixtures/license-test-page.ts`:

```ts
watermark(): Locator {
  return this.page.locator('[data-tourkit-watermark]')
}

async assertWatermarkVisible(): Promise<void> {
  await expect(this.watermark()).toHaveCount(1)
  await expect(this.watermark()).toBeVisible()
}

async assertWatermarkHidden(): Promise<void> {
  await expect(this.watermark()).toHaveCount(0)
}

async assertAllProSoftRender(): Promise<void> {
  await this.assertAllProRender()
  await this.assertWatermarkVisible()
}
```

Keep `placeholder()` only if `placeholder-ui.spec.ts` is rewritten to mount `<ProGate>` directly. Otherwise remove placeholder-specific helpers to avoid preserving a stale contract.

### Localhost specs

For `e2e/next/localhost-bypass.spec.ts`:

- Keep loop for:
  - `valid license` -> `/license-valid`
  - `invalid key` -> `/license-invalid`
  - `no provider` -> `/license-none`
- For each loop case:
  - `assertAllFreeRender()`
  - `assertAllProRender()`
  - `assertWatermarkHidden()`
- Add dedicated `empty key on localhost renders packages and shows watermark`:
  - route `/license-empty`
  - `assertAllFreeRender()`
  - `assertAllProRender()`
  - `assertWatermarkVisible()`

For `e2e/vite/localhost-bypass.spec.ts`, use the same structure with scenario selector buttons:

- loop: `licensed`, `invalid-key`, `no-provider`
- dedicated case: `empty-key`

### Production-like specs

Update these to soft-gate assertions:

- `e2e/next/production-empty-key.spec.ts`
- `e2e/vite/production-empty-key.spec.ts`
- `e2e/next/production-invalid-key.spec.ts`
- `e2e/vite/production-invalid-key.spec.ts`
- `e2e/next/production-no-provider.spec.ts`
- `e2e/vite/production-no-provider.spec.ts`

Expected assertion shape:

```ts
await ltp.assertAllFreeRender()
await ltp.assertAllProRender()
await ltp.assertWatermarkVisible()
```

For `production-valid-license.spec.ts`, add `assertWatermarkHidden()`.

### Placeholder UI specs

The current `placeholder-ui.spec.ts` files assert per-package hard placeholders in the license test apps. That no longer matches the source code: pro packages use `<LicenseGate>`, which is soft and renders a global `<LicenseWatermark>`.

Choose one:

- Preferred: rewrite them as `watermark-ui.spec.ts` and assert the global watermark text, accessible region, link target, UTM URL, and singleton count.
- Alternative: delete them if `license-watermark.test.tsx` already covers enough UI detail and E2E only needs behavior parity.

Do not keep placeholder assertions against pro package blocks.

---

## Existing helpers and fixtures

Use what already exists:

- `packages/license/src/__tests__/helpers.ts`
  - `createMockLocalStorage()`
  - `mockFetchResponse()`

- `packages/license/src/__tests__/helpers/license-fixtures.ts`
  - existing `VALID_PRO_STATE`, `VALID_FREE_STATE`, `INVALID_STATE`, `ERROR_STATE`, `DEV_BYPASS_STATE`

Add an explicit unlicensed fixture if useful:

```ts
export const UNLICENSED_STATE: LicenseState = {
  status: 'invalid',
  tier: 'free',
  activations: 0,
  maxActivations: 0,
  domain: null,
  expiresAt: null,
  validatedAt: 0,
  renderKey: undefined,
}
```

Do not reuse existing `INVALID_STATE` for the no-key path if its `maxActivations` remains `5`; the planned missing-key state uses `maxActivations: 0`.

---

## What not to test

- Do not hit the real Polar API.
- Do not assert exact `Date.now()` values outside the pure helper tests.
- Do not add a new `missing` status.
- Do not expect an empty local key to call `validateLicenseKey()` from the provider.
- Do not expect local non-empty keys to be proven valid.
- Do not keep E2E placeholder assertions for packages that use `<LicenseGate>`.
- Do not manually edit generated `apps/docs/public/llms*.txt` as part of test work.

---

## Run order

Fast package feedback:

```bash
pnpm --filter @tour-kit/license test -- license-state.test
pnpm --filter @tour-kit/license test -- license-provider.test
pnpm --filter @tour-kit/license test -- polar-client.test
pnpm --filter @tour-kit/license test -- use-license-gate.test
pnpm --filter @tour-kit/license test -- license-gate.test
pnpm --filter @tour-kit/license test -- pro-gate.test
```

Whole package:

```bash
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/license typecheck
```

Downstream package tests:

```bash
pnpm --filter @tour-kit/adoption \
     --filter @tour-kit/announcements \
     --filter @tour-kit/surveys \
     --filter @tour-kit/ai \
     --filter @tour-kit/checklists \
     --filter @tour-kit/media \
     --filter @tour-kit/scheduling \
     --filter @tour-kit/analytics test
```

Changed E2E:

```bash
pnpm exec playwright test e2e/vite/localhost-bypass.spec.ts --project=vite-localhost
pnpm exec playwright test e2e/next/localhost-bypass.spec.ts --project=next-localhost
pnpm exec playwright test e2e/vite/production-empty-key.spec.ts --project=vite-production
pnpm exec playwright test e2e/next/production-empty-key.spec.ts --project=next-production
pnpm exec playwright test e2e/vite/production-invalid-key.spec.ts --project=vite-production
pnpm exec playwright test e2e/next/production-invalid-key.spec.ts --project=next-production
pnpm exec playwright test e2e/vite/production-no-provider.spec.ts --project=vite-production
pnpm exec playwright test e2e/next/production-no-provider.spec.ts --project=next-production
```

Optional rewritten watermark UI specs:

```bash
pnpm exec playwright test e2e/vite/watermark-ui.spec.ts --project=vite-production
pnpm exec playwright test e2e/next/watermark-ui.spec.ts --project=next-production
```

Manual dashboard smoke:

```bash
pnpm --filter dashboard-next dev
```

Check:

- Empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`: one bottom-right watermark appears.
- Non-empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`: no watermark and no Polar request on localhost.

---

## Acceptance checklist

- `licenseKey=""` no longer appears in any test that expects `dev_bypass`.
- Missing and whitespace keys are covered in both provider and headless validator tests.
- `useLicenseGate()` has explicit provider-precedence coverage.
- `<ProGate>` has provider + empty-key localhost coverage.
- Localhost E2E has a dedicated empty-key watermark test.
- Production-like E2E specs assert soft gate + global watermark, not per-package placeholders.
- No-provider localhost behavior remains quiet.
- `pnpm --filter @tour-kit/license test` passes.
- `pnpm --filter @tour-kit/license typecheck` passes.
