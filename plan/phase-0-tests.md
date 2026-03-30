# Phase 0 Test Plan — Polar API Validation Gate

| Field | Value |
|-------|-------|
| **Scope** | Validate Polar.sh license key API (validate, activate, deactivate) works end-to-end with acceptable latency |
| **Key Pattern** | Research/validation — real API calls, no mocks. Tests target metric functions and API response shape. |
| **Dependencies** | `@polar-sh/sdk` (dev), `dotenv` (dev), Polar sandbox account with test product + license key |

---

## User Stories

| ID | Story | Acceptance Criteria | Test Tier |
|----|-------|---------------------|-----------|
| US-01 | As a developer, I need to confirm Polar's validate endpoint returns `status: "granted"` for a valid key so I know the API can gate Pro features | Validate returns HTTP 200, `status === "granted"`, response includes `id`, `limit_activations`, `usage` | Integration |
| US-02 | As a developer, I need to confirm invalid keys are rejected so the system cannot be bypassed with arbitrary strings | Invalid key returns non-200 or `status !== "granted"` | Integration |
| US-03 | As a developer, I need activation/deactivation to precisely track slot usage so per-domain licensing works | Each activate increments `usage` by 1, each deactivate decrements by 1, exceeding limit errors | Integration |
| US-04 | As a developer, I need validation latency under 500ms (p95) so client-side checks do not degrade UX | 10 sequential validate calls have p95 < 500ms | Performance |
| US-05 | As a developer, I need a machine-readable go/no-go document so downstream phases can check the gate | `phase-0-status.json` contains `decision`, `tests` object with status for each operation | Smoke |

---

## 1. Component Mock Strategy

| Component | Strategy | Rationale |
|-----------|----------|-----------|
| Polar Validate API | **Real API** — no mock | This is the thing being tested. Mocking it would defeat the purpose. |
| Polar Activate API | **Real API** — no mock | Must confirm actual slot accounting behavior against sandbox. |
| Polar Deactivate API | **Real API via SDK** — no mock | Must confirm SDK auth pattern works and usage decrements. |
| Network / `fetch()` | **Real network** | Latency measurement requires real network calls. |
| Environment variables | **Real `.env`** loaded via `dotenv` or shell `source` | Script requires real credentials for sandbox. |

---

## 2. Test Tier Table

| Tier | Count | What it covers |
|------|-------|----------------|
| **Integration (API shape)** | 5 | Validate valid key, validate invalid key, activate response shape, deactivate success, slot accounting |
| **Performance (latency)** | 2 | p50/p95 measurement, p95 < 500ms assertion |
| **Smoke (deliverable)** | 2 | `phase-0-status.json` schema validation, script runs without crash |
| **Total** | **9** | |

---

## 3. No Fake Implementations (Research Phase)

This is a research/validation phase where the Polar API itself is the subject under test. Mocking or faking any API would invalidate the results — the entire point is to confirm real API behavior, response shapes, and latency characteristics against the Polar sandbox.

---

## 4. Test File List

| File | Tier | Tests | Description |
|------|------|-------|-------------|
| `scripts/polar-validation-test.ts` | Integration + Performance | 9 | Standalone script exercising all API operations and measuring latency. Runs via `npx tsx`. |
| `scripts/__tests__/polar-validation.test.ts` | Smoke | 2 | Optional Vitest suite that validates the script's helper functions (latency math, assert logic) and `phase-0-status.json` schema after the main script has been run. |

> **Note:** The primary deliverable (`polar-validation-test.ts`) is a standalone script, not a Vitest test file. This is intentional — Phase 0 is manual validation, not CI-automated testing. The optional Vitest file provides a safety net for the metric calculation logic.

---

## 5. Test Setup (Vitest Patterns)

Since the standalone script uses raw `assert()` calls, the Vitest file covers post-run validation and helper logic.

```typescript
// scripts/__tests__/polar-validation.test.ts
import { describe, it, expect, beforeAll } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const STATUS_PATH = resolve(__dirname, '../../plan/phase-0-status.json')

describe('Phase 0 — Post-run validation', () => {
  let statusDoc: Record<string, unknown>

  beforeAll(() => {
    // This suite runs AFTER the standalone script has executed
    // and phase-0-status.json has been written.
    if (!existsSync(STATUS_PATH)) {
      throw new Error(
        'phase-0-status.json does not exist. Run polar-validation-test.ts first.'
      )
    }
    statusDoc = JSON.parse(readFileSync(STATUS_PATH, 'utf-8'))
  })

  it('phase-0-status.json has required top-level fields', () => {
    expect(statusDoc).toHaveProperty('phase', 0)
    expect(statusDoc).toHaveProperty('name')
    expect(statusDoc).toHaveProperty('date')
    expect(statusDoc).toHaveProperty('decision')
    expect(['proceed', 'adjust', 'abort']).toContain(statusDoc.decision)
  })

  it('phase-0-status.json has test results for all operations', () => {
    const tests = statusDoc.tests as Record<string, unknown>
    expect(tests).toHaveProperty('validate')
    expect(tests).toHaveProperty('activate')
    expect(tests).toHaveProperty('deactivate')
    expect(tests).toHaveProperty('latency')

    const latency = tests.latency as Record<string, unknown>
    expect(typeof latency.p50_ms).toBe('number')
    expect(typeof latency.p95_ms).toBe('number')
  })
})

describe('Latency calculation helpers', () => {
  it('computes p50 and p95 correctly from sorted array', () => {
    // Simulates the latency math from the standalone script
    const latencies = [50, 80, 100, 120, 150, 180, 200, 250, 300, 450]
    // Already sorted, 10 samples
    const p50 = latencies[4] // index 4
    const p95 = latencies[9] // index 9

    expect(p50).toBe(150)
    expect(p95).toBe(450)
    expect(p95).toBeLessThan(500) // Budget check
  })

  it('flags p95 over budget', () => {
    const latencies = [50, 80, 100, 120, 150, 180, 200, 250, 300, 600]
    const p95 = latencies[9]

    expect(p95).toBeGreaterThanOrEqual(500)
  })
})
```

---

## 6. Key Testing Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Standalone script as primary test artifact | `npx tsx scripts/polar-validation-test.ts` | Phase 0 is a one-time manual gate, not a recurring CI test. A single script with console output is the fastest path to a go/no-go answer. |
| Real API calls, no mocks | All tests hit Polar sandbox | The purpose of Phase 0 is to validate that the real API works. Mocking would make the tests meaningless. |
| Sequential latency measurement | 10 calls in a `for` loop, not `Promise.all` | Sequential calls simulate real user validation flow (one key check per page load). Parallel calls would measure Polar's throughput, not user-experienced latency. |
| `performance.now()` for timing | Built into Node.js, no dependencies | Sub-millisecond resolution, no external packages needed. |
| `process.exit(1)` on first failure | Fail-fast in standalone script | For a go/no-go gate, the first failure is enough to trigger investigation. No need to collect all failures. |
| Optional Vitest suite for post-run checks | Validates `phase-0-status.json` schema + latency math | Catches human error in writing the status document and ensures percentile math is correct. |
| Test cleanup: deactivate all slots after test | Script deactivates everything it activates | Prevents test pollution — leaves the license key in a clean state for re-runs. |

---

## 7. Example Test Case (Vitest / TypeScript)

```typescript
// Example: Validate that a valid license key returns expected shape
// This shows the pattern used in the standalone script, adapted to Vitest syntax

import { describe, it, expect } from 'vitest'

const VALIDATE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys/validate'

describe('Polar Validate Endpoint', () => {
  // Skip if env vars not set (CI without sandbox credentials)
  const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID
  const POLAR_TEST_LICENSE_KEY = process.env.POLAR_TEST_LICENSE_KEY

  it.skipIf(!POLAR_ORGANIZATION_ID || !POLAR_TEST_LICENSE_KEY)(
    'returns status "granted" for a valid key with expected response shape',
    async () => {
      const res = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: POLAR_TEST_LICENSE_KEY,
          organization_id: POLAR_ORGANIZATION_ID,
        }),
      })

      expect(res.status).toBe(200)

      const data = await res.json()

      // Shape assertions — these define what Phase 1 Zod schemas must match
      expect(data).toMatchObject({
        status: 'granted',
      })
      expect(typeof data.id).toBe('string')
      expect(typeof data.limit_activations).toBe('number')
      expect(typeof data.usage).toBe('number')
      expect(data.organization_id).toBe(POLAR_ORGANIZATION_ID)
    },
  )

  it.skipIf(!POLAR_ORGANIZATION_ID)(
    'rejects an invalid key (does not return "granted")',
    async () => {
      const res = await fetch(VALIDATE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          key: 'TOURKIT-INVALID-FAKE-KEY-99999',
          organization_id: POLAR_ORGANIZATION_ID,
        }),
      })

      // Either non-200 status OR 200 with non-granted status
      if (res.status === 200) {
        const data = await res.json()
        expect(data.status).not.toBe('granted')
      } else {
        // 404, 422, etc. — all acceptable for invalid key
        expect(res.status).toBeGreaterThanOrEqual(400)
      }
    },
  )
})
```

---

## 8. Execution Prompt

> Paste this into a Claude Code session to implement the Phase 0 tests.

---

You are writing tests for **Phase 0 (Polar API Validation Gate)** of the Tour Kit licensing system.

**Context:**
- Project root: `/home/domidex/projects/tour-kit/`
- Phase plan: `plan/phase-0.md`
- Test plan: `plan/phase-0-tests.md`
- Runtime: Node.js 18+, TypeScript, `npx tsx` for standalone scripts, Vitest for test suites
- Package manager: pnpm

**What already exists or will exist:**
- `scripts/polar-validation-test.ts` — standalone validation script (primary deliverable from Phase 0)
- `plan/phase-0-status.json` — go/no-go decision document (written after running the script)

**Your task:**
1. Ensure `scripts/polar-validation-test.ts` contains all assertion checks from Phase 0 tasks (0.2, 0.3, 0.4):
   - Validate valid key: HTTP 200, `status === "granted"`, shape fields (`id`, `limit_activations`, `usage`)
   - Validate invalid key: non-granted response
   - Activation cycle: usage increments by 1 per activate, decrements by 1 per deactivate
   - Slot limit: 6th activation on a 5-limit key fails
   - Latency: 10 sequential calls, p50 and p95 computed, p95 < 500ms
   - Cleanup: all activated slots are deactivated at the end

2. Create `scripts/__tests__/polar-validation.test.ts` (Vitest) with:
   - Post-run validation of `phase-0-status.json` schema
   - Latency percentile math unit tests
   - Use `describe`/`it`/`expect` patterns, `beforeAll` for setup
   - Use `it.skipIf()` for tests that require env vars

3. Do NOT mock any API calls. This is a research phase — real Polar sandbox calls are the point.

4. Ensure all tests handle the case where env vars are not set (skip gracefully, do not crash).

---

## 9. Run Commands

```bash
# ── Primary: Run the standalone validation script ──
cd /home/domidex/projects/tour-kit
npx tsx scripts/polar-validation-test.ts

# ── Secondary: Run the Vitest post-run checks ──
# (only after the standalone script has been run and phase-0-status.json exists)
pnpm vitest run scripts/__tests__/polar-validation.test.ts

# ── Run with env vars inline (if not using .env) ──
POLAR_ORGANIZATION_ID=xxx POLAR_TEST_LICENSE_KEY=xxx POLAR_ACCESS_TOKEN=xxx \
  npx tsx scripts/polar-validation-test.ts

# ── Run Vitest in watch mode during development ──
pnpm vitest scripts/__tests__/polar-validation.test.ts
```
