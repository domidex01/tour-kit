# Phase 0 — Polar API Validation Gate

**Duration:** Days 1–2 (~3.5 hours)
**Depends on:** Nothing
**Blocks:** Phase 1, Phase 2, Phase 3, Phase 4, Phase 5
**Risk Level:** HIGH — binary go/no-go gate; if Polar API is unreliable or undocumented, entire project pivots
**Stack:** typescript

---

## 1. Objective + What Success Looks Like

1. A Polar sandbox account exists with a test product configured: license key benefit, prefix `TOURKIT`, 5 activations max, perpetual (non-expiring).
2. A standalone TypeScript script (`scripts/polar-validation-test.ts`) calls Polar's public license key API with zero dependencies beyond `fetch()` and prints structured results.
3. `POST /v1/customer-portal/license-keys/validate` returns `status: 'granted'` for a valid test key and a non-granted status for a garbage key.
4. `POST /v1/customer-portal/license-keys/activate` with `label: 'test.example.com'` increments the activation count by exactly 1.
5. `POST /v1/customer-portal/license-keys/deactivate` with the returned `activation_id` decrements the activation count by exactly 1.
6. 10 sequential validation calls complete with p95 latency < 500ms.
7. A machine-readable decision document (`plan/phase-0-status.json`) records all measurements and a `"decision": "go"` or `"decision": "no-go"` verdict.

---

## 2. What Failure Looks Like (and what to do)

| Failure | Detection | Fallback |
|---------|-----------|----------|
| Cannot create Polar sandbox account or test product | Task 0.1 — manual setup fails, no API credentials available | Investigate Polar docs/Discord. If blocked for >1 hour, evaluate alternatives: Keygen.sh, LemonSqueezy, or self-hosted key validation. Log `"decision": "no-go"` with reason. |
| Validate endpoint returns unexpected shape or status | Task 0.2 — response JSON does not contain `status` field, or valid key returns non-`granted` status | Check Polar API version. Try with/without `organization_id`. If still broken, open Polar support ticket. If unresolved in 2 hours, log no-go. |
| Activate does not increment count, or deactivate does not decrement | Task 0.3 — activation count before/after does not differ by exactly 1 | Re-read API docs for activation counting semantics. May need to call validate with `activation_id` to check. If fundamentally broken, log no-go — activation gating is a core requirement. |
| p95 latency > 500ms | Task 0.4 — latency measurements exceed threshold | Re-run from a different network. If consistently >500ms, this is still a soft pass — the 24h cache means validation only happens once per day. Note the latency in the decision doc and proceed with a warning. Hard no-go only if p95 > 2000ms. |
| Polar sandbox is rate-limited or returns 429 | Any task — unexpected rate limiting | Check Polar rate limit docs. If rate limit is < 10 req/min, this is a concern for activation flows but acceptable for cached validation. Note in decision doc. |

---

## 3. Architecture / Key Design Decisions

This phase produces a throwaway validation script, not production code. Architectural decisions are minimal:

1. **Raw `fetch()` only** — no `@polar-sh/sdk`, no `node-fetch`, no axios. The script proves the API works with the same approach the production SDK will use. Run with `bun` or `tsx` (both support top-level await and native `fetch`).

2. **Sandbox API base URL** — Polar sandbox uses `https://sandbox-api.polar.sh`. Production uses `https://api.polar.sh`. The script must use the sandbox URL. The base URL will be extracted as a constant so it is trivial to switch.

3. **No authentication headers** — All three license key endpoints (`validate`, `activate`, `deactivate`) are public (confirmed in research). The script sends no `Authorization` header. If this assumption is wrong, that is itself a critical finding.

4. **Sequential execution** — The script runs tasks in order (validate, activate, validate-again, deactivate, validate-again, latency loop). No parallelism. This is deliberate — we need to observe state changes between calls.

5. **Environment variables** — The script reads `POLAR_TEST_KEY` and `POLAR_ORGANIZATION_ID` from environment variables (or a `.env` file via `--env-file` flag). No secrets are committed.

---

## 4. Tasks

### Task 0.1 — Create Polar Sandbox Account + Test Product (0.5h)

**What:** Set up the Polar sandbox environment that all subsequent tasks depend on.

**Steps:**
1. Go to `https://sandbox.polar.sh` and create an account (or log in).
2. Create an organization (or use existing).
3. Create a new product:
   - Name: `Tour Kit Pro (Test)`
   - Price: $99 one-time (non-recurring)
   - Add a "License Key" benefit:
     - Prefix: `TOURKIT`
     - Max activations: 5
     - Expiration: None (perpetual)
4. Generate a test license key manually (or purchase the test product to trigger key generation).
5. Record in a local `.env` file (gitignored):
   ```
   POLAR_TEST_KEY=TOURKIT_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   POLAR_ORGANIZATION_ID=xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
   ```

**Output:** Polar sandbox configured, `.env` file with test credentials.

---

### Task 0.2 — Write Validation Script (1h)

**What:** Create `scripts/polar-validation-test.ts` that validates a license key against the Polar sandbox API.

**File:** `scripts/polar-validation-test.ts`

**API call:**
```typescript
// POST https://sandbox-api.polar.sh/v1/customer-portal/license-keys/validate
// Content-Type: application/json
// Body: { "key": "<POLAR_TEST_KEY>", "organization_id": "<POLAR_ORGANIZATION_ID>" }
// Expected response: { "status": "granted", "id": "...", "key": "...", ... }
```

**Script structure:**
1. Read env vars `POLAR_TEST_KEY` and `POLAR_ORGANIZATION_ID`.
2. Call validate endpoint with valid key — assert `status === 'granted'`, print full response.
3. Call validate endpoint with garbage key (`TOURKIT_00000000-0000-0000-0000-000000000000`) — assert `status !== 'granted'` or HTTP error.
4. Print PASS/FAIL for each assertion.

**Run command:** `bun run scripts/polar-validation-test.ts` or `npx tsx scripts/polar-validation-test.ts`

**Output:** Working validation script, console output showing PASS/FAIL for valid and invalid keys.

---

### Task 0.3 — Test Activation/Deactivation Cycle (1h)

**What:** Extend the script to test the full activate/deactivate lifecycle and verify activation counting.

**API calls:**
```typescript
// Step 1: Validate — record initial activation count from response
// POST /v1/customer-portal/license-keys/validate

// Step 2: Activate for test.example.com
// POST /v1/customer-portal/license-keys/activate
// Body: { "key": "...", "organization_id": "...", "label": "test.example.com" }
// Expected: 200 with { "id": "<activation_id>", "license_key_id": "...", "label": "test.example.com" }

// Step 3: Validate again — assert activation count incremented by 1

// Step 4: Deactivate
// POST /v1/customer-portal/license-keys/deactivate
// Body: { "key": "...", "organization_id": "...", "activation_id": "<activation_id>" }
// Expected: 204 No Content

// Step 5: Validate again — assert activation count decremented by 1
```

**Assertions:**
- Activate returns 200 with an `id` field (the `activation_id`).
- Post-activate validation shows activation count = initial + 1.
- Deactivate returns 204.
- Post-deactivate validation shows activation count = initial (back to original).

**Edge case to test:** Activate with the same label twice — does Polar allow duplicate labels or reject? Record the behavior either way; it informs the production SDK design.

**Output:** Console output showing activation count before, after activate, and after deactivate, with PASS/FAIL assertions.

---

### Task 0.4 — Measure Validation Latency (0.5h)

**What:** Extend the script to run 10 sequential validation calls and report latency statistics.

**Implementation:**
```typescript
const latencies: number[] = [];
for (let i = 0; i < 10; i++) {
  const start = performance.now();
  await fetch(VALIDATE_URL, { method: 'POST', headers, body });
  const elapsed = performance.now() - start;
  latencies.push(elapsed);
}
// Sort and compute p50 (index 4), p95 (index 9)
latencies.sort((a, b) => a - b);
const p50 = latencies[4];
const p95 = latencies[9];
```

**Threshold:** p95 < 500ms is a PASS. p95 500ms–2000ms is a WARN (acceptable due to 24h cache). p95 > 2000ms is a FAIL.

**Output:** Latency table printed to console, p50 and p95 highlighted.

---

### Task 0.5 — Go/No-Go Decision Document (0.5h)

**What:** Write `plan/phase-0-status.json` summarizing all findings.

**Schema:**
```json
{
  "phase": 0,
  "date": "2026-03-31",
  "decision": "go | no-go",
  "reason": "string",
  "results": {
    "validate_valid_key": "pass | fail",
    "validate_invalid_key": "pass | fail",
    "activate_returns_id": "pass | fail",
    "activation_count_increments": "pass | fail",
    "deactivation_count_decrements": "pass | fail",
    "duplicate_label_behavior": "string — describe what happened",
    "latency_p50_ms": 0,
    "latency_p95_ms": 0,
    "latency_verdict": "pass | warn | fail"
  },
  "notes": ["string — any surprises, deviations from docs, or concerns"],
  "polar_sandbox": {
    "base_url": "https://sandbox-api.polar.sh",
    "organization_id": "redacted",
    "product_name": "Tour Kit Pro (Test)",
    "key_prefix": "TOURKIT",
    "max_activations": 5
  }
}
```

**Decision logic:**
- **GO** if: validate works, activate/deactivate cycle works, latency p95 < 2000ms.
- **NO-GO** if: any of validate, activate, or deactivate is fundamentally broken (wrong response shape, auth required when docs say public, endpoint 404, etc.).
- **CONDITIONAL GO** if: latency is high (500ms–2000ms) but everything else passes — proceed but add a note about aggressive caching.

**Output:** `plan/phase-0-status.json` committed to repo.

---

## 5. Deliverables

```
tour-kit/
├── scripts/
│   └── polar-validation-test.ts    # Standalone validation script (tasks 0.2–0.4)
├── plan/
│   ├── phase-0-status.json         # Go/no-go decision document (task 0.5)
│   └── licence-phase-0.md          # This file
└── .env                            # Local only, gitignored (task 0.1)
```

---

## 6. Exit Criteria

| # | Criterion | Measurement |
|---|-----------|-------------|
| EC-1 | Polar sandbox validate endpoint returns `status: 'granted'` for valid key | Script output shows PASS for valid key validation |
| EC-2 | Polar sandbox validate endpoint rejects invalid key | Script output shows PASS for invalid key rejection |
| EC-3 | Activation consumes exactly 1 slot | Activation count after activate = initial + 1 |
| EC-4 | Deactivation frees exactly 1 slot | Activation count after deactivate = initial |
| EC-5 | p95 validation latency < 500ms (hard fail at > 2000ms) | Latency report in script output |
| EC-6 | All 3 endpoints are public (no auth header required) | Script sends no `Authorization` header and gets 200/204 responses |
| EC-7 | Go/no-go decision documented | `plan/phase-0-status.json` exists with `decision` field |

**Gate:** Phase 1 does not begin until EC-7 shows `"decision": "go"` or `"decision": "conditional-go"`.

---

## 7. Execution Prompt

> **Benchmark Brief — Polar API Validation Gate**
>
> You are validating whether Polar.sh's license key API works correctly for Tour Kit's licensing system. This is a research gate, not a build task. The entire licensing project depends on this result.
>
> ### What to Measure
>
> 1. **Validate endpoint correctness** — Does `POST https://sandbox-api.polar.sh/v1/customer-portal/license-keys/validate` with body `{ "key": "<valid_key>", "organization_id": "<org_id>" }` return a JSON object with `"status": "granted"`? Does a garbage key return a non-granted status or an error?
>
> 2. **Activate/deactivate lifecycle** — Does `POST .../activate` with `{ "key", "organization_id", "label": "test.example.com" }` return a 200 with an `id` field? Does a subsequent validate call show the activation count incremented by exactly 1? Does `POST .../deactivate` with `{ "key", "organization_id", "activation_id" }` return 204 and decrement the count by exactly 1?
>
> 3. **Auth requirement** — Do all 3 endpoints work without an `Authorization` header? If any endpoint returns 401/403 without auth, that is a critical finding.
>
> 4. **Latency** — Run 10 sequential validate calls. Record each round-trip time. Compute p50 (median) and p95. Threshold: p95 < 500ms is green, 500–2000ms is yellow (acceptable with caching), >2000ms is red.
>
> 5. **Duplicate label behavior** — What happens if you activate the same key with the same label twice? Does Polar reject it, create a duplicate, or return the existing activation?
>
> ### How to Run the Experiment
>
> **Prerequisites:**
> - Polar sandbox account at `https://sandbox.polar.sh`
> - A test product with license key benefit (prefix `TOURKIT`, 5 activations, perpetual)
> - A generated test key and the organization ID in a `.env` file
>
> **Script:** Write `scripts/polar-validation-test.ts`. Use only `fetch()` — no SDKs, no libraries. The script should:
> 1. Read `POLAR_TEST_KEY` and `POLAR_ORGANIZATION_ID` from env.
> 2. Run each test in sequence, printing PASS/FAIL per assertion.
> 3. Run the 10-call latency benchmark and print a summary table.
> 4. Output a JSON blob matching the `phase-0-status.json` schema at the end.
>
> **Run:** `bun run scripts/polar-validation-test.ts` (or `npx tsx scripts/polar-validation-test.ts`)
>
> **Confirmed API details (from research):**
> - Base URL: `https://sandbox-api.polar.sh`
> - Validate: `POST /v1/customer-portal/license-keys/validate` — body: `{ key, organization_id }` — returns `ValidatedLicenseKey` with `status: 'granted' | 'revoked' | 'disabled'`
> - Activate: `POST /v1/customer-portal/license-keys/activate` — body: `{ key, organization_id, label }` — returns `LicenseKeyActivationRead` with `id`, `license_key_id`, `label`, `meta`
> - Deactivate: `POST /v1/customer-portal/license-keys/deactivate` — body: `{ key, organization_id, activation_id }` — returns 204 No Content
> - All 3 endpoints are public (no auth header)
> - Content-Type: `application/json` for all requests
>
> ### Go/No-Go Decision
>
> Write `plan/phase-0-status.json` with the results. Apply this decision matrix:
>
> | Condition | Decision |
> |-----------|----------|
> | All 5 measurements pass (validate, activate, deactivate, auth-free, p95 < 500ms) | **GO** — proceed to Phase 1 |
> | Validate + activate + deactivate work, but p95 is 500–2000ms | **CONDITIONAL GO** — proceed with note to prioritize aggressive caching in Phase 1 |
> | Any core endpoint (validate, activate, deactivate) is broken, returns wrong shape, or requires auth | **NO-GO** — stop, evaluate alternatives (Keygen.sh, LemonSqueezy, self-hosted) |
> | Sandbox is down or unreachable | **RETRY** — wait 24h, try again. If still down, **NO-GO** |
>
> Do not begin Phase 1 until this decision document exists.

---

## Readiness Check

| # | Item | Status |
|---|------|--------|
| 1 | Polar sandbox URL confirmed (`https://sandbox.polar.sh`) | PASS |
| 2 | All 3 API endpoint paths confirmed in Polar docs | PASS |
| 3 | Request/response schemas documented in big plan | PASS |
| 4 | No auth required for public endpoints (confirmed) | PASS |
| 5 | `bun` or `tsx` available to run TypeScript scripts | PASS |
| 6 | `.env` is in `.gitignore` | CHECK — verify before running |
| 7 | No external dependencies needed (raw `fetch()`) | PASS |
| 8 | Decision matrix defined with clear go/no-go criteria | PASS |
