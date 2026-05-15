# Fix: localhost no-key should be unlicensed

**Package:** `@tour-kit/license`  
**Type:** Patch behavior fix  
**Owner:** TBD  
**Status:** Planned

---

## Goal

When `<LicenseProvider licenseKey="">` is mounted on `localhost`, `127.0.0.1`, or `*.local`, Tour Kit should behave as unlicensed and show the watermark through the normal soft-gate path.

The dev bypass should still skip Polar calls and activation usage for local development, but only when a non-empty key is present.

Define "missing key" as `licenseKey.trim().length === 0`.

---

## Expected behavior

| Host | Provider | Key | Expected state | Gate behavior | Polar call |
| --- | --- | --- | --- | --- | --- |
| Production-like host | Mounted | Missing | `invalid` / `free` | Watermark or fallback | No |
| Production-like host | Mounted | Valid | `valid` / `pro` | No watermark | Yes, cache-aware |
| Production-like host | Mounted | Invalid | `invalid` / `free` | Watermark or fallback | Yes, cache-aware |
| Local dev host | Mounted | Missing | `invalid` / `free` | Watermark or fallback | No |
| Local dev host | Mounted | Non-empty | `valid` / `pro`, `renderKey: "dev_bypass"` | No watermark | No |
| Local dev host | Missing provider | Unknown | No provider state | Children only, no watermark | No |

Important wording: on local hosts the bypass is for any **non-empty** key, not a proven-valid key. We intentionally do not validate local keys because that would consume activation slots and hit Polar during normal dev.

---

## Current root cause

1. [packages/license/src/context/license-context.tsx:53](/home/domidex/projects/tour-kit/packages/license/src/context/license-context.tsx:53) short-circuits on `isDevEnvironment()` before checking whether `licenseKey` is present.
2. [packages/license/src/context/license-context.tsx:101](/home/domidex/projects/tour-kit/packages/license/src/context/license-context.tsx:101) derives `isGated: false` for every dev host, even after state becomes `invalid`.
3. [packages/license/src/lib/polar-client.ts:194](/home/domidex/projects/tour-kit/packages/license/src/lib/polar-client.ts:194) exports the same unconditional dev bypass through `validateLicenseKey()`, so headless consumers can still get Pro state for an empty key.
4. [packages/license/src/hooks/use-license-gate.ts:33](/home/domidex/projects/tour-kit/packages/license/src/hooks/use-license-gate.ts:33) bypasses dev hosts before reading provider context, so `<ProGate>` and custom `useLicenseGate()` consumers would ignore the provider's fixed no-key state.
5. [packages/license/src/components/license-gate.tsx:23](/home/domidex/projects/tour-kit/packages/license/src/components/license-gate.tsx:23) intentionally keeps no-provider localhost quiet. Leave this branch unchanged because there is no provider-owned key to inspect.

---

## Implementation plan

### 1. Add a small shared state/key helper

Create `packages/license/src/lib/license-state.ts` (name flexible) to avoid duplicating state literals between the React provider and headless validator:

```ts
import type { LicenseState } from '../types'

export function normalizeLicenseKey(key: string): string {
  return key.trim()
}

export function hasLicenseKey(key: string): boolean {
  return normalizeLicenseKey(key).length > 0
}

export function createUnlicensedState(now = Date.now()): LicenseState {
  return {
    status: 'invalid',
    tier: 'free',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    renderKey: undefined,
  }
}

export function createDevBypassState(now = Date.now()): LicenseState {
  return {
    status: 'valid',
    tier: 'pro',
    activations: 0,
    maxActivations: 0,
    domain: null,
    expiresAt: null,
    validatedAt: now,
    renderKey: 'dev_bypass',
  }
}
```

Keep the existing `LicenseState.status` union. Do not add a `'missing'` status in this patch. `invalid` is good enough for downstream gating and avoids type churn.

### 2. Fix `<LicenseProvider>`

Update [packages/license/src/context/license-context.tsx](/home/domidex/projects/tour-kit/packages/license/src/context/license-context.tsx:53):

```ts
const validate = useCallback(async () => {
  const normalizedKey = normalizeLicenseKey(licenseKey)

  if (!normalizedKey) {
    const next = createUnlicensedState()
    setState(next)
    onValidateRef.current?.(next)
    return
  }

  if (isDevEnvironment()) {
    const next = createDevBypassState()
    setState(next)
    onValidateRef.current?.(next)
    return
  }

  try {
    const result = organizationId
      ? await validateLicenseKey(normalizedKey, organizationId)
      : await validateLicenseKey(normalizedKey)
    setState(result)
    onValidateRef.current?.(result)
  } catch (error) {
    // Existing error path unchanged.
  }
}, [licenseKey, organizationId])
```

Then update the derived gate signal:

```ts
const normalizedKey = normalizeLicenseKey(licenseKey)

if (isDevEnvironment() && normalizedKey) {
  return { isGated: false, isLoading: false, gracePeriodActive: false }
}
```

This preserves the local bypass for non-empty keys but lets no-key state flow to `isGated: true`.

### 3. Fix the exported headless validator

Update [packages/license/src/lib/polar-client.ts](/home/domidex/projects/tour-kit/packages/license/src/lib/polar-client.ts:186):

```ts
export async function validateLicenseKey(
  key: string,
  organizationId?: string
): Promise<LicenseState> {
  const domain = getCurrentDomain()
  const orgId = organizationId ?? ''
  const now = Date.now()
  const normalizedKey = normalizeLicenseKey(key)

  // Missing key is unlicensed everywhere, including localhost.
  // Do this before cache reads so an old cached valid state cannot mask an
  // empty env var.
  if (!normalizedKey) {
    return createUnlicensedState(now)
  }

  if (isDevEnvironment()) {
    return createDevBypassState(now)
  }

  // Use normalizedKey for cache, validate, activate, renderKey, and writeCache.
}
```

Use `normalizedKey` consistently in:

- `readCache(domain, normalizedKey)`
- `validateKey(normalizedKey, orgId)`
- `activateKey(normalizedKey, orgId, domain)`
- `generateRenderKey(normalizedKey, activationLabel)`
- `writeCache(domain, state, normalizedKey)`

### 4. Fix `useLicenseGate()`

Update [packages/license/src/hooks/use-license-gate.ts](/home/domidex/projects/tour-kit/packages/license/src/hooks/use-license-gate.ts:30) so provider context wins over hostname:

```ts
export function useLicenseGate(): LicenseGateResult {
  const context = useContext(LicenseContext)

  if (context !== null) {
    return { isGated: context.isGated, isLoading: context.isLoading }
  }

  // No provider: keep localhost quiet because there is no licenseKey prop to inspect.
  if (isDevEnvironment()) {
    return { isGated: false, isLoading: false }
  }

  return { isGated: true, isLoading: false }
}
```

This closes the `<ProGate>` and custom-hook gap while preserving the explicit no-provider dev behavior.

### 5. Keep `<LicenseGate>` no-provider behavior unchanged

Do not add key-related props to `<LicenseGate>` in this patch.

The no-provider branch cannot know whether a key exists. Keep local dev quiet and production-like hosts watermarked. Update comments/docs only if needed.

---

## Tests to update

### Provider tests

Update [packages/license/src/__tests__/license-provider.test.tsx](/home/domidex/projects/tour-kit/packages/license/src/__tests__/license-provider.test.tsx:173):

- Replace the current "dev mode returns valid pro" test that uses `licenseKey=""`.
- Add `localhost with empty key returns invalid/free and does not call validateLicenseKey`.
- Add `localhost with non-empty key returns dev_bypass and does not call validateLicenseKey`.
- Assert `onValidate` receives the same state shape for the no-key branch.

### Headless validator tests

Update [packages/license/src/__tests__/polar-client.test.ts](/home/domidex/projects/tour-kit/packages/license/src/__tests__/polar-client.test.ts:277):

- Split the existing dev-bypass test:
  - `validateLicenseKey('', org)` on localhost returns `invalid/free`, `renderKey` undefined, no fetch.
  - `validateLicenseKey('TOURKIT_key', org)` on localhost returns `valid/pro`, `renderKey: 'dev_bypass'`, no fetch.
- Add a whitespace-key case: `validateLicenseKey('   ', org)` behaves like missing.
- Add a normalized-key cache/API assertion if easy: a key with accidental surrounding whitespace uses the trimmed key for cache/API calls.

### Gate and hook tests

Update [packages/license/src/__tests__/license-gate.test.tsx](/home/domidex/projects/tour-kit/packages/license/src/__tests__/license-gate.test.tsx:206):

- Add `LicenseProvider empty key on localhost renders children plus watermark`.
- Keep `outside LicenseProvider on a dev host renders children only` green.
- Add `LicenseProvider non-empty key on localhost renders children without watermark`.

Update [packages/license/src/__tests__/hooks.test.tsx](/home/domidex/projects/tour-kit/packages/license/src/__tests__/hooks.test.tsx:1) or add a small `use-license-gate.test.tsx`:

- With provider + empty key + dev host, `useLicenseGate()` eventually returns `{ isGated: true, isLoading: false }`.
- Without provider + dev host, `useLicenseGate()` returns `{ isGated: false, isLoading: false }`.

### E2E tests

Current localhost specs treat `empty-key` as a bypass case:

- [e2e/next/localhost-bypass.spec.ts](/home/domidex/projects/tour-kit/e2e/next/localhost-bypass.spec.ts:5)
- [e2e/vite/localhost-bypass.spec.ts](/home/domidex/projects/tour-kit/e2e/vite/localhost-bypass.spec.ts:4)

Change them to:

- Keep `valid license`, `invalid key`, and `no provider` in the "all pro packages render without watermark" loop.
- Move `empty key` into its own test:
  - free packages render
  - pro packages render because `<LicenseGate>` is soft
  - one `[data-tourkit-watermark]` badge is visible

Add helper methods to [e2e/fixtures/license-test-page.ts](/home/domidex/projects/tour-kit/e2e/fixtures/license-test-page.ts:1):

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
```

If production-empty-key specs still assert hard placeholders, align them with the current soft-gate contract: pro UI renders and watermark appears unless a `fallback` prop is explicitly provided.

---

## Docs and example cleanup

### Changeset

Add `.changeset/license-localhost-empty-key-watermark.md`:

```markdown
---
'@tour-kit/license': patch
---

Fix localhost licensing so an empty `licenseKey` is treated as unlicensed.

Local development still skips Polar validation and activation usage when a
non-empty key is configured. When the key is missing or blank, Tour Kit now
shows the same unlicensed watermark on localhost that it shows in production.
```

### Dashboard example

Remove the temporary forced watermark path from [examples/dashboard-next/app/dashboard/layout.tsx](/home/domidex/projects/tour-kit/examples/dashboard-next/app/dashboard/layout.tsx:8):

- Remove `LicenseWatermark` import.
- Remove `NEXT_PUBLIC_TOUR_KIT_SHOW_WATERMARK`.
- Remove `{showWatermark && <LicenseWatermark />}`.

Update [examples/dashboard-next/README.md](/home/domidex/projects/tour-kit/examples/dashboard-next/README.md:24):

- Remove `NEXT_PUBLIC_TOUR_KIT_SHOW_WATERMARK`.
- Change "all optional on localhost" wording. The license key is optional for trying the app, but leaving it empty now intentionally shows the unlicensed badge.

### Public docs

Update at least:

- [packages/license/README.md](/home/domidex/projects/tour-kit/packages/license/README.md:21)
- [apps/docs/content/docs/licensing/index.mdx](/home/domidex/projects/tour-kit/apps/docs/content/docs/licensing/index.mdx:162)
- [apps/docs/content/docs/api/license.mdx](/home/domidex/projects/tour-kit/apps/docs/content/docs/api/license.mdx:74)

Required wording changes:

- "Dev bypass" only applies when a non-empty key is configured.
- Empty or whitespace-only keys are unlicensed on every host.
- Localhost with no key shows the watermark; localhost with a non-empty key skips Polar and consumes no activation slot.
- No-provider localhost remains quiet because there is no key to inspect.

Do not edit generated `apps/docs/public/llms*.txt` manually unless the repo has a documented generation step for them.

---

## Verification

Run focused checks first:

```bash
pnpm --filter @tour-kit/license test
pnpm --filter @tour-kit/license typecheck
```

Then run downstream soft-gate integration tests. Use explicit filters rather than brace expansion if the shell/package manager behaves differently:

```bash
pnpm --filter @tour-kit/adoption --filter @tour-kit/announcements --filter @tour-kit/surveys --filter @tour-kit/ai --filter @tour-kit/checklists --filter @tour-kit/media --filter @tour-kit/scheduling --filter @tour-kit/analytics test
```

Run the changed E2E specs:

```bash
pnpm exec playwright test e2e/vite/localhost-bypass.spec.ts --project=vite-localhost
pnpm exec playwright test e2e/next/localhost-bypass.spec.ts --project=next-localhost
pnpm exec playwright test e2e/vite/production-empty-key.spec.ts --project=vite-production
pnpm exec playwright test e2e/next/production-empty-key.spec.ts --project=next-production
```

Manual smoke for the canonical dashboard:

```bash
pnpm --filter dashboard-next dev
```

Check:

- Empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`: dashboard renders and one bottom-right unlicensed badge appears.
- Non-empty `NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY`: dashboard renders with no badge and no Polar request on localhost.

---

## Downstream audit

After implementation, scan for downstream code that assumes localhost always means Pro:

```bash
rg -n "useLicenseGate\\(|state\\.tier|state\\.status|dev_bypass" \
  packages/adoption/src packages/announcements/src packages/surveys/src \
  packages/ai/src packages/checklists/src packages/media/src \
  packages/scheduling/src packages/analytics/src \
  -g '!**/__tests__/**'
```

Expected result: no production package should branch directly on `state.tier === 'pro'` to unlock behavior. Pro packages should route licensing decisions through `<LicenseGate>` or `useLicenseGate()`.

---

## Risks and decisions

| Concern | Decision |
| --- | --- |
| Local first-run now shows a badge | Intentional. It surfaces a missing env var before deployment. |
| Non-empty but invalid local key still bypasses | Intentional. Local bypass cannot verify validity without Polar calls and activation risk. |
| Whitespace-only key | Treat as missing. Trim before presence checks, cache keys, validation, activation, and render-key generation. |
| Old valid cache masking empty key | Prevented by checking missing key before cache reads. |
| No-provider localhost | Leave quiet. Without a provider, the library cannot know whether a key was configured. |
| New `missing` status | Out of scope. Use existing `invalid` status to keep the patch small and compatible. |

---

## Order of operations

1. Add the changeset.
2. Add the shared state/key helper.
3. Update `license-context.tsx`, `polar-client.ts`, and `use-license-gate.ts`.
4. Update unit tests for provider, headless validator, gate, and hook behavior.
5. Update localhost E2E expectations and watermark helpers.
6. Remove the dashboard forced-watermark flag.
7. Update README/docs wording.
8. Run focused package tests, downstream tests, changed E2E specs, and dashboard smoke.

---
