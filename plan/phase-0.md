# Phase 0 — Polar API Validation Gate ✅ COMPLETE (2026-03-30)

**Duration:** Days 1–2 (~3–4 hours)
**Depends on:** Nothing
**Blocks:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5, Phase 6
**Risk Level:** HIGH — binary go/no-go decision; if Polar API is unreliable or undocumented, the entire licensing project changes direction
**Stack:** typescript
**Runner:** Manual (Polar sandbox setup) + scripted validation

---

## 1. Objective + What Success Looks Like

Phase 0 answers one question: **does Polar.sh's license key API reliably validate, activate, and deactivate license keys with acceptable latency?**

This is not an engineering phase. No production code ships. The output is a standalone test script and a go/no-go decision document. The script exercises three Polar API operations — validate, activate, deactivate — against the sandbox environment and measures latency.

Success looks like:

1. **Validation works** — `POST /v1/customer-portal/license-keys/validate` returns `status: "granted"` for a valid key and a non-granted status for an invalid key. Response shape matches the documented schema.
2. **Activation/deactivation cycle works** — activating for `test.example.com` increments usage by exactly 1. Deactivating with the returned `activation_id` decrements usage by exactly 1. The slot accounting is precise.
3. **Latency is acceptable** — 10 sequential validation calls complete with p95 < 500ms. This confirms Polar's API can serve client-side validation without degrading UX.
4. **API is stable and documented** — no undocumented quirks, no 500 errors, no auth surprises. The three endpoints behave as specified.

**Success looks like:** All three API operations validated, latency within budget, and `plan/phase-0-status.json` records `"decision": "proceed"`.

---

## 2. What Failure Looks Like (and what to do)

| Failure Mode | Symptom | Response |
|---|---|---|
| Polar sandbox unavailable or signup broken | Cannot create account, dashboard 500s, or sandbox API returns connection errors | Wait 24h and retry. If still broken: **abort** — Polar infrastructure is not production-ready. Evaluate alternatives (Keygen.sh, Lemon Squeezy, self-hosted). |
| Validate endpoint returns unexpected shape | Response body missing `status`, `id`, or `limit_activations` fields, or field names differ from documentation | Adjust Zod schemas to match actual response. If the shape is fundamentally different (e.g., no activation tracking): **abort** — the API cannot support per-domain activation. |
| Activation does not increment usage | After `activate`, the `usage` field on subsequent `validate` call is unchanged | Check if activation requires auth. Try with `@polar-sh/sdk` authenticated client. If activation is server-only: **adjust** — Phase 1 architecture must include a lightweight server proxy for activation. |
| Deactivation fails or requires undocumented auth | `@polar-sh/sdk` `licenseKeys.deactivate()` throws, or requires scopes not available on sandbox | If deactivation is entirely broken: **adjust** — remove deactivation from MVP scope, rely on manual Polar dashboard management. If it requires different auth: document the correct setup. |
| p95 latency > 500ms | Validation calls consistently exceed 500ms (network or Polar processing) | Run test from a US-East server (closest to Polar infra). If still slow: **adjust** — increase cache TTL from 24h to 72h in Phase 1 to reduce API calls. If p95 > 2000ms: **abort** — latency is unacceptable for client-side validation. |
| Invalid key returns 200 with `status: "granted"` | API does not distinguish valid from invalid keys | **Abort** — the validation endpoint is fundamentally broken. |

**Decision framework:**
- All 3 operations work + latency in budget → **proceed** to Phase 1
- 1 operation has a workaround (e.g., deactivation needs different auth) → **adjust** (document workaround, re-estimate affected phases, proceed)
- Validation or activation fundamentally broken → **abort** (Polar is not viable; evaluate Keygen.sh or self-hosted)

---

## 3. Key Design Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Raw `fetch()` for validate + activate | No SDK dependency in test script | The production `@tour-kit/license` package will use raw `fetch()` for client-side calls (validate, activate are no-auth endpoints). Using `fetch()` in Phase 0 proves the exact pattern Phase 1 will use. |
| `@polar-sh/sdk` for deactivate only | Server-side authenticated call | Deactivation requires an `accessToken` per Polar docs. The SDK handles auth headers. This confirms the server-side pattern needed in Phase 4 (webhook handler). |
| Standalone script, not test suite | `scripts/polar-validation-test.ts` run via `npx tsx` | Phase 0 is a manual validation, not automated CI. A single script with console output is faster to iterate than a test framework. The script becomes throwaway after the go/no-go decision. |
| Sandbox environment only | `sandbox-api.polar.sh` (if exists) or production with test product | Never use real customer keys for validation testing. Sandbox isolates test data. |
| Latency measurement via `performance.now()` | 10 sequential calls, sort, pick p50 and p95 | Sequential (not parallel) calls simulate real user behavior. 10 samples is enough for a go/no-go signal — this is not a load test. |

---

## 4. Tasks

### Task 0.1 — Create Polar Sandbox Account + Test Product (0.5h)

Manual setup in Polar.sh dashboard:

1. Create a Polar sandbox account (or use existing account in sandbox mode)
2. Create a test product named "Tour Kit Pro (Test)"
3. Add a **license key benefit** with:
   - Key prefix: `TOURKIT`
   - Activation limit: 5
   - Type: perpetual (no expiration)
4. Generate a test license key from the dashboard
5. Record the following values in a local `.env` file (not committed):

```
POLAR_ORGANIZATION_ID=<your_org_id>
POLAR_TEST_LICENSE_KEY=<generated_key>
POLAR_ACCESS_TOKEN=<your_access_token>
```

**Verification:** Dashboard shows product with license key benefit. A key starting with `TOURKIT-` is visible.

### Task 0.2 — Write Validation Script (1h)

Create `scripts/polar-validation-test.ts` that exercises the Polar API end-to-end.

The script must:

1. **Validate a valid key** — confirm `status: "granted"`, log full response shape
2. **Validate an invalid key** — confirm non-granted status or error response
3. **Activate for a domain** — activate for `test.example.com`, capture `activation_id`
4. **Validate with activation** — re-validate with `activation_id`, confirm activation object in response
5. **Deactivate** — deactivate using `@polar-sh/sdk`, confirm success
6. **Re-validate after deactivation** — confirm usage decremented

**API calls used:**

Validate (no auth):
```typescript
const res = await fetch('https://api.polar.sh/v1/customer-portal/license-keys/validate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: POLAR_TEST_LICENSE_KEY,
    organization_id: POLAR_ORGANIZATION_ID,
  }),
})
const data = await res.json()
// Expect: { id, organization_id, status: "granted", limit_activations, usage, ... }
```

Activate (no auth):
```typescript
const res = await fetch('https://api.polar.sh/v1/customer-portal/license-keys/activate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    key: POLAR_TEST_LICENSE_KEY,
    organization_id: POLAR_ORGANIZATION_ID,
    label: 'test.example.com',
  }),
})
const data = await res.json()
// Expect: { id (activation_id), license_key_id, label, license_key: { usage, ... } }
```

Deactivate (requires SDK + accessToken):
```typescript
import { Polar } from '@polar-sh/sdk'

const polar = new Polar({ accessToken: POLAR_ACCESS_TOKEN })
await polar.licenseKeys.deactivate({
  key: POLAR_TEST_LICENSE_KEY,
  organizationId: POLAR_ORGANIZATION_ID,
  activationId: activationId,
})
```

**Verification:** Script runs to completion, all assertions pass, output shows full API response shapes.

### Task 0.3 — Test Activation/Deactivation Cycle (1h)

Extend the script from 0.2 to verify slot accounting:

1. Record initial `usage` from validate response
2. Activate for `test.example.com` — verify `usage` incremented by 1
3. Activate for `test2.example.com` — verify `usage` incremented by 1 again
4. Deactivate `test2.example.com` — verify `usage` decremented by 1
5. Deactivate `test.example.com` — verify `usage` back to initial value
6. Attempt to activate 6 times (exceeding limit of 5) — verify the 6th activation fails with an appropriate error

**Verification:** Each activation increments usage by exactly 1, each deactivation decrements by exactly 1, and exceeding the limit produces an error (not a silent success).

### Task 0.4 — Measure Validation Latency (0.5h)

Add a latency measurement section to the script:

```typescript
const latencies: number[] = []
for (let i = 0; i < 10; i++) {
  const start = performance.now()
  await fetch('https://api.polar.sh/v1/customer-portal/license-keys/validate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: POLAR_TEST_LICENSE_KEY,
      organization_id: POLAR_ORGANIZATION_ID,
    }),
  })
  latencies.push(performance.now() - start)
}

latencies.sort((a, b) => a - b)
const p50 = latencies[4]  // index 4 for 10 samples
const p95 = latencies[9]  // index 9 for 10 samples

console.log(`p50: ${p50.toFixed(0)}ms`)
console.log(`p95: ${p95.toFixed(0)}ms`)
console.log(`Pass: ${p95 < 500 ? 'YES' : 'NO — p95 exceeds 500ms budget'}`)
```

**Verification:** p95 < 500ms. All 10 calls return 200.

### Task 0.5 — Go/No-Go Decision Document (0.5h)

Create `plan/phase-0-status.json` based on results:

```json
{
  "phase": 0,
  "name": "Polar API Validation Gate",
  "date": "YYYY-MM-DD",
  "decision": "proceed | adjust | abort",
  "tests": {
    "validate": {
      "status": "pass | fail",
      "notes": "..."
    },
    "activate": {
      "status": "pass | fail",
      "notes": "..."
    },
    "deactivate": {
      "status": "pass | fail",
      "notes": "..."
    },
    "latency": {
      "status": "pass | fail",
      "p50_ms": 0,
      "p95_ms": 0,
      "notes": "..."
    }
  },
  "adjustments": [],
  "blockers": []
}
```

---

## 5. Deliverables

```
scripts/
└── polar-validation-test.ts    # Standalone test script (temporary — delete after go/no-go)

plan/
└── phase-0-status.json         # Permanent — go/no-go decision record with latency data
```

| Deliverable | Path | Lifetime |
|---|---|---|
| Validation test script | `scripts/polar-validation-test.ts` | Temporary — delete after Phase 0 decision |
| Decision document | `plan/phase-0-status.json` | Permanent — audit trail |

---

## 6. Exit Criteria

- [ ] Polar sandbox validate endpoint returns `status: "granted"` for valid key and non-granted for invalid key
- [ ] Activation for `test.example.com` increments `usage` by exactly 1
- [ ] Deactivation frees exactly 1 slot (usage decrements by 1)
- [ ] Exceeding activation limit (6th activation on a 5-limit key) produces an error
- [ ] p95 validation latency < 500ms across 10 sequential calls
- [ ] `plan/phase-0-status.json` exists with `decision` field set to `proceed`, `adjust`, or `abort`

---

## 7. Execution Prompt

> Paste this entire section into a fresh Claude Code session to implement Phase 0.

---

You are implementing **Phase 0 (Polar API Validation Gate)** for the Tour Kit licensing system — replacing JWT-based licensing with Polar.sh-backed license key validation.

**Your goal:** Write a standalone script that validates Polar's license key API works end-to-end, measure latency, and produce a go/no-go decision. This is throwaway validation code — correctness matters, polish does not.

### Project Context

- **Project:** Tour Kit — a headless onboarding and product tour library for React (TypeScript monorepo)
- **Root:** `/home/domidex/projects/tour-kit/`
- **Package manager:** pnpm
- **Runtime:** Node.js with `npx tsx` for TypeScript execution
- **What we are validating:** Polar.sh's customer-portal API for license key validation, activation, and deactivation

### Prerequisites

Before running the script, ensure these environment variables are set (create a `.env` file in the repo root or export them):

```
POLAR_ORGANIZATION_ID=<your_org_id>
POLAR_TEST_LICENSE_KEY=<generated_TOURKIT_prefixed_key>
POLAR_ACCESS_TOKEN=<your_polar_access_token>
```

The Polar sandbox account must already be created with a test product that has a license key benefit (prefix `TOURKIT`, 5 activations, perpetual). This is a manual step done before running the script.

### Step 1: Install SDK Dependency

```bash
cd /home/domidex/projects/tour-kit
pnpm add -Dw @polar-sh/sdk
```

This is needed only for the deactivation endpoint (which requires authentication). Validate and activate are unauthenticated.

### Step 2: Create the Validation Script

Create `scripts/polar-validation-test.ts` with the following structure:

```typescript
/**
 * Phase 0 — Polar API Validation Gate
 *
 * Standalone script to validate Polar.sh license key API works end-to-end.
 * Run: npx tsx scripts/polar-validation-test.ts
 *
 * Required env vars:
 *   POLAR_ORGANIZATION_ID — your Polar organization ID
 *   POLAR_TEST_LICENSE_KEY — a valid TOURKIT-prefixed license key
 *   POLAR_ACCESS_TOKEN — Polar access token (for deactivation only)
 */

import { Polar } from '@polar-sh/sdk'

const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID
const POLAR_TEST_LICENSE_KEY = process.env.POLAR_TEST_LICENSE_KEY
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN

if (!POLAR_ORGANIZATION_ID || !POLAR_TEST_LICENSE_KEY || !POLAR_ACCESS_TOKEN) {
  console.error('Missing required env vars: POLAR_ORGANIZATION_ID, POLAR_TEST_LICENSE_KEY, POLAR_ACCESS_TOKEN')
  process.exit(1)
}

const VALIDATE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys/validate'
const ACTIVATE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys/activate'

// ── Helpers ──

async function validate(key: string, organizationId: string, activationId?: string) {
  const body: Record<string, string> = { key, organization_id: organizationId }
  if (activationId) body.activation_id = activationId

  const res = await fetch(VALIDATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
  return { status: res.status, data: await res.json() }
}

async function activate(key: string, organizationId: string, label: string) {
  const res = await fetch(ACTIVATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId, label }),
  })
  return { status: res.status, data: await res.json() }
}

async function deactivate(key: string, organizationId: string, activationId: string) {
  const polar = new Polar({ accessToken: POLAR_ACCESS_TOKEN! })
  await polar.licenseKeys.deactivate({
    key,
    organizationId,
    activationId,
  })
}

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    process.exit(1)
  }
  console.log(`  PASS: ${message}`)
}

// ── Tests ──

async function testValidateValidKey() {
  console.log('\n--- Test: Validate valid key ---')
  const { status, data } = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  console.log('  Response status:', status)
  console.log('  Response body:', JSON.stringify(data, null, 2))

  assert(status === 200, 'HTTP 200')
  assert(data.status === 'granted', `status is "granted" (got "${data.status}")`)
  assert(typeof data.id === 'string', 'id is a string')
  assert(typeof data.limit_activations === 'number', 'limit_activations is a number')
  assert(typeof data.usage === 'number', 'usage is a number')

  return data
}

async function testValidateInvalidKey() {
  console.log('\n--- Test: Validate invalid key ---')
  const { status, data } = await validate('TOURKIT-INVALID-KEY-12345', POLAR_ORGANIZATION_ID!)
  console.log('  Response status:', status)
  console.log('  Response body:', JSON.stringify(data, null, 2))

  // Polar may return 404 or 200 with non-granted status — either is acceptable
  assert(
    status !== 200 || data.status !== 'granted',
    'Invalid key does NOT return granted status'
  )
}

async function testActivationDeactivationCycle() {
  console.log('\n--- Test: Activation/Deactivation cycle ---')

  // Get baseline usage
  const baseline = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  const initialUsage = baseline.data.usage
  console.log(`  Initial usage: ${initialUsage}`)

  // Activate for test.example.com
  console.log('\n  Activating for test.example.com...')
  const act1 = await activate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, 'test.example.com')
  console.log('  Activate response:', JSON.stringify(act1.data, null, 2))
  assert(act1.status === 200, 'Activation HTTP 200')
  const activationId1 = act1.data.id
  assert(typeof activationId1 === 'string', 'activation_id is a string')

  // Verify usage incremented
  const afterAct1 = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  assert(afterAct1.data.usage === initialUsage + 1, `Usage incremented to ${initialUsage + 1} (got ${afterAct1.data.usage})`)

  // Activate for test2.example.com
  console.log('\n  Activating for test2.example.com...')
  const act2 = await activate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, 'test2.example.com')
  assert(act2.status === 200, 'Second activation HTTP 200')
  const activationId2 = act2.data.id

  // Verify usage incremented again
  const afterAct2 = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  assert(afterAct2.data.usage === initialUsage + 2, `Usage incremented to ${initialUsage + 2} (got ${afterAct2.data.usage})`)

  // Deactivate test2.example.com
  console.log('\n  Deactivating test2.example.com...')
  await deactivate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId2)
  console.log('  PASS: Deactivation did not throw')

  // Verify usage decremented
  const afterDeact1 = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  assert(afterDeact1.data.usage === initialUsage + 1, `Usage decremented to ${initialUsage + 1} (got ${afterDeact1.data.usage})`)

  // Deactivate test.example.com
  console.log('\n  Deactivating test.example.com...')
  await deactivate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId1)
  console.log('  PASS: Deactivation did not throw')

  // Verify usage back to baseline
  const afterDeact2 = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  assert(afterDeact2.data.usage === initialUsage, `Usage back to ${initialUsage} (got ${afterDeact2.data.usage})`)
}

async function testLatency() {
  console.log('\n--- Test: Validation latency (10 calls) ---')
  const latencies: number[] = []

  for (let i = 0; i < 10; i++) {
    const start = performance.now()
    await fetch(VALIDATE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        key: POLAR_TEST_LICENSE_KEY,
        organization_id: POLAR_ORGANIZATION_ID,
      }),
    })
    const elapsed = performance.now() - start
    latencies.push(elapsed)
    console.log(`  Call ${i + 1}: ${elapsed.toFixed(0)}ms`)
  }

  latencies.sort((a, b) => a - b)
  const p50 = latencies[4]
  const p95 = latencies[9]

  console.log(`\n  p50: ${p50.toFixed(0)}ms`)
  console.log(`  p95: ${p95.toFixed(0)}ms`)
  assert(p95 < 500, `p95 < 500ms (got ${p95.toFixed(0)}ms)`)

  return { p50, p95, latencies }
}

// ── Main ──

async function main() {
  console.log('=== Phase 0: Polar API Validation Gate ===')
  console.log(`Organization ID: ${POLAR_ORGANIZATION_ID}`)
  console.log(`License Key: ${POLAR_TEST_LICENSE_KEY!.slice(0, 12)}...`)

  await testValidateValidKey()
  await testValidateInvalidKey()
  await testActivationDeactivationCycle()
  const { p50, p95 } = await testLatency()

  console.log('\n=== ALL TESTS PASSED ===')
  console.log(`\nLatency: p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms`)
  console.log('\nDecision: PROCEED')
  console.log('Create plan/phase-0-status.json with decision: "proceed"')
}

main().catch((err) => {
  console.error('\n=== TEST FAILED ===')
  console.error(err)
  process.exit(1)
})
```

### Step 3: Run the Script

```bash
cd /home/domidex/projects/tour-kit

# Load env vars (adjust path if using .env file)
source .env  # or: export POLAR_ORGANIZATION_ID=... POLAR_TEST_LICENSE_KEY=... POLAR_ACCESS_TOKEN=...

npx tsx scripts/polar-validation-test.ts
```

Watch for:
- All assertions pass (no `FAIL` lines)
- Full response shapes logged (record these for Phase 1 Zod schema design)
- p95 latency < 500ms

### Step 4: Record the Decision

Based on test results, create `plan/phase-0-status.json`:

```json
{
  "phase": 0,
  "name": "Polar API Validation Gate",
  "date": "YYYY-MM-DD",
  "decision": "proceed",
  "tests": {
    "validate": {
      "status": "pass",
      "notes": "Returns status: granted for valid key. Response shape matches docs."
    },
    "activate": {
      "status": "pass",
      "notes": "Usage increments by 1 per activation. Activation ID returned."
    },
    "deactivate": {
      "status": "pass",
      "notes": "Usage decrements by 1. SDK deactivate works with accessToken."
    },
    "latency": {
      "status": "pass",
      "p50_ms": 0,
      "p95_ms": 0,
      "notes": "10 sequential validate calls. p95 under 500ms budget."
    }
  },
  "adjustments": [],
  "blockers": []
}
```

Fill in actual `p50_ms` and `p95_ms` values. Update `status` and `notes` fields with real results. If any test fails, set `decision` to `"adjust"` or `"abort"` and document the failure in `blockers`.

### Decision Table

| Outcome | Criteria | Action |
|---|---|---|
| **Proceed** | All 4 tests pass | Move to Phase 1. Delete `scripts/polar-validation-test.ts`. Keep `plan/phase-0-status.json`. |
| **Adjust** | 1 test fails with known workaround (e.g., deactivation needs different auth pattern) | Document workaround in `adjustments`. Re-estimate affected phase hours. Proceed with caution. |
| **Abort** | Validation or activation fundamentally broken, or p95 > 2000ms | Stop. Evaluate alternatives (Keygen.sh, Lemon Squeezy, self-hosted). Update `plan/licence-big-plan.md` with findings. |

### Cleanup After Decision

If decision is `proceed` or `adjust`:
1. Delete `scripts/polar-validation-test.ts`
2. Remove `@polar-sh/sdk` dev dependency if not needed until Phase 4 (or keep it — it will be needed later)
3. Commit `plan/phase-0-status.json`

### Success Criteria Summary

- Validate returns `status: "granted"` for valid key
- Invalid key does not return `status: "granted"`
- Each activation increments usage by exactly 1
- Each deactivation decrements usage by exactly 1
- p95 validation latency < 500ms (10 sequential calls)
- `plan/phase-0-status.json` written with decision

---

## Readiness Check

Before starting Phase 0, confirm:

- [ ] Polar.sh account created (sandbox mode)
- [ ] Test product created with license key benefit (prefix `TOURKIT`, 5 activations, perpetual)
- [ ] Test license key generated and recorded
- [ ] `POLAR_ORGANIZATION_ID`, `POLAR_TEST_LICENSE_KEY`, and `POLAR_ACCESS_TOKEN` env vars are available
- [ ] `pnpm install` runs successfully at the monorepo root
- [ ] Node.js >= 18 is installed (required for native `fetch()`)
- [ ] You understand that Phase 0 output is throwaway — only the decision document persists
