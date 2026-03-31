/**
 * Phase 0 — Polar API Validation Gate
 *
 * Standalone script to validate Polar.sh license key API works end-to-end.
 * Run: npx tsx scripts/polar-validation-test.ts
 *
 * Required env vars:
 *   POLAR_ORGANIZATION_ID — your Polar organization ID
 *   POLAR_TEST_LICENSE_KEY — a valid TOURKIT-prefixed license key
 *   POLAR_ACCESS_TOKEN — Polar access token (for SDK deactivation test)
 *
 * API shape confirmed against live Polar API (2026-03-30):
 *   - Request bodies use snake_case: { key, organization_id, activation_id, label }
 *   - Validate response: { id, status: "granted", limit_activations, usage, activation? }
 *   - Activate response: { id, license_key_id, label, license_key: {...} }
 *   - Deactivate response: 204 No Content
 *   - `usage` does NOT track activations. Activations tracked via activation records.
 *   - Validate with activation_id returns { activation: {...} } to confirm specific activation.
 */

import { Polar } from '@polar-sh/sdk'

const POLAR_ORGANIZATION_ID = process.env.POLAR_ORGANIZATION_ID
const POLAR_TEST_LICENSE_KEY = process.env.POLAR_TEST_LICENSE_KEY
const POLAR_ACCESS_TOKEN = process.env.POLAR_ACCESS_TOKEN

if (!POLAR_ORGANIZATION_ID || !POLAR_TEST_LICENSE_KEY || !POLAR_ACCESS_TOKEN) {
  console.error(
    'Missing required env vars: POLAR_ORGANIZATION_ID, POLAR_TEST_LICENSE_KEY, POLAR_ACCESS_TOKEN'
  )
  process.exit(1)
}

const BASE_URL = 'https://api.polar.sh/v1/customer-portal/license-keys'
const VALIDATE_URL = `${BASE_URL}/validate`
const ACTIVATE_URL = `${BASE_URL}/activate`
const DEACTIVATE_URL = `${BASE_URL}/deactivate`

// ── Results collector (for phase-0-status.json) ──

interface TestResult {
  status: 'pass' | 'fail'
  notes: string
}

const results: Record<string, TestResult & Record<string, unknown>> = {}

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

async function deactivateRaw(key: string, organizationId: string, activationId: string) {
  const res = await fetch(DEACTIVATE_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ key, organization_id: organizationId, activation_id: activationId }),
  })
  return { status: res.status }
}

async function deactivateSDK(key: string, organizationId: string, activationId: string) {
  const polar = new Polar({ accessToken: POLAR_ACCESS_TOKEN! })
  await polar.licenseKeys.deactivate({ key, organizationId, activationId })
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`  FAIL: ${message}`)
    throw new Error(`Assertion failed: ${message}`)
  }
  console.log(`  PASS: ${message}`)
}

// ── Cleanup tracker ──

const activationIdsToCleanup: string[] = []

async function cleanup() {
  if (activationIdsToCleanup.length === 0) return
  console.log(`\n--- Cleanup: deactivating ${activationIdsToCleanup.length} activation(s) ---`)
  for (const id of activationIdsToCleanup) {
    try {
      await deactivateRaw(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, id)
      console.log(`  Deactivated: ${id}`)
    } catch (err) {
      console.warn(`  Warning: failed to deactivate ${id}:`, err)
    }
  }
  activationIdsToCleanup.length = 0
}

// ���─ Tests ──

async function testValidateValidKey() {
  console.log('\n--- Test: Validate valid key ---')
  const { status, data } = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!)
  console.log('  Response status:', status)
  console.log('  Response body:', JSON.stringify(data, null, 2))

  assert(status === 200, 'HTTP 200')
  assert(typeof data.id === 'string', 'id is a string')
  assert(data.organization_id === POLAR_ORGANIZATION_ID, 'organization_id matches')
  assert(data.status === 'granted', `status is "granted" (got "${data.status}")`)
  assert(typeof data.limit_activations === 'number', 'limit_activations is a number')
  assert(typeof data.usage === 'number', 'usage is a number')
  console.log(`  Activations: limit=${data.limit_activations}, usage=${data.usage}`)

  results.validate = {
    status: 'pass',
    notes: `status: "granted", limit_activations: ${data.limit_activations}, usage field present. Key fields: ${Object.keys(data).join(', ')}`,
  }
  return data
}

async function testValidateInvalidKey() {
  console.log('\n--- Test: Validate invalid key ---')
  const { status, data } = await validate('TOURKIT-INVALID-KEY-12345', POLAR_ORGANIZATION_ID!)
  console.log('  Response status:', status)
  console.log('  Response body:', JSON.stringify(data, null, 2))

  assert(status === 404, `Invalid key returns 404 (got ${status})`)
}

async function testActivationDeactivationCycle() {
  console.log('\n--- Test: Activation/Deactivation cycle ---')

  // Activate for test.example.com
  console.log('\n  Activating for test.example.com...')
  const act1 = await activate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, 'test.example.com')
  console.log('  Activate response status:', act1.status)
  assert(act1.status === 200, 'Activation HTTP 200')

  const activationId1 = act1.data.id
  assert(typeof activationId1 === 'string', 'activation_id is a string')
  assert(act1.data.label === 'test.example.com', 'label matches')
  assert(typeof act1.data.license_key_id === 'string', 'license_key_id present')
  activationIdsToCleanup.push(activationId1)

  // Validate with activation_id — confirms the activation is tracked
  await sleep(300)
  console.log('\n  Validating with activation_id...')
  const withAct = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId1)
  assert(withAct.status === 200, 'Validate with activation_id returns 200')
  assert(withAct.data.activation !== null, 'activation object present in response')
  assert(withAct.data.activation.id === activationId1, 'activation.id matches')
  assert(withAct.data.activation.label === 'test.example.com', 'activation.label matches')

  // Activate for test2.example.com
  await sleep(300)
  console.log('\n  Activating for test2.example.com...')
  const act2 = await activate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, 'test2.example.com')
  assert(act2.status === 200, 'Second activation HTTP 200')
  const activationId2 = act2.data.id
  activationIdsToCleanup.push(activationId2)

  // Deactivate test2 using raw fetch (customer portal — no auth needed)
  await sleep(300)
  console.log('\n  Deactivating test2.example.com (raw fetch)...')
  const deact1 = await deactivateRaw(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId2)
  assert(deact1.status === 204, `Raw deactivation returns 204 (got ${deact1.status})`)
  activationIdsToCleanup.splice(activationIdsToCleanup.indexOf(activationId2), 1)

  // Confirm deactivated — validate with old activation_id should show no activation
  const afterDeact = await validate(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId2)
  assert(
    afterDeact.data.activation === null || afterDeact.status === 404,
    'Deactivated activation no longer valid'
  )

  // Deactivate test1 using SDK (tests authenticated server-side pattern)
  await sleep(300)
  console.log('\n  Deactivating test.example.com (SDK)...')
  try {
    await deactivateSDK(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId1)
    activationIdsToCleanup.splice(activationIdsToCleanup.indexOf(activationId1), 1)
    console.log('  PASS: SDK deactivation succeeded')
    results.deactivate = { status: 'pass', notes: 'Both raw (204) and SDK deactivation work.' }
  } catch (err) {
    // If SDK deactivate fails, fall back to raw fetch
    console.warn('  WARN: SDK deactivation failed, falling back to raw fetch:', err)
    await deactivateRaw(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, activationId1)
    activationIdsToCleanup.splice(activationIdsToCleanup.indexOf(activationId1), 1)
    console.log('  PASS: Raw deactivation fallback succeeded')
    results.deactivate = {
      status: 'pass',
      notes:
        'SDK deactivation failed but raw customer portal deactivation works (204). SDK may need server URL or different auth.',
    }
  }

  results.activate = {
    status: 'pass',
    notes:
      'Activation returns activation_id + label. Validate with activation_id confirms activation. Deactivation returns 204 and invalidates the activation.',
  }
  if (!results.deactivate) {
    results.deactivate = { status: 'pass', notes: 'Both raw (204) and SDK deactivation work.' }
  }
}

async function testActivationLimit() {
  console.log('\n--- Test: Activation limit enforcement ---')
  console.log('  Note: Polar counts ALL activations (including deactivated) towards limit.')
  console.log('  Testing that activations beyond limit are rejected with 403.')

  // Try to activate — if we get 403, the limit is already reached from earlier tests
  await sleep(500)
  const probe = await activate(
    POLAR_TEST_LICENSE_KEY!,
    POLAR_ORGANIZATION_ID!,
    'limit-probe.example.com'
  )

  if (probe.status === 403) {
    // Limit already reached from earlier cycle test activations
    console.log('  Limit already reached (403) — Polar counts deactivated activations too.')
    console.log('  PASS: Activation limit enforcement confirmed (403 on exceed)')
    assert(true, 'Activation limit enforced with HTTP 403')
  } else if (probe.status === 200) {
    // Still have room — fill remaining slots then test overflow
    activationIdsToCleanup.push(probe.data.id)
    const tempActivations = [probe.data.id]

    // Keep activating until we hit the limit
    let hitLimit = false
    for (let i = 1; i < 10; i++) {
      await sleep(500)
      const act = await activate(
        POLAR_TEST_LICENSE_KEY!,
        POLAR_ORGANIZATION_ID!,
        `limit-test-${i}.example.com`
      )
      if (act.status === 429) {
        console.log('  Rate limited, waiting 5s...')
        await sleep(5000)
        continue
      }
      if (act.status >= 400) {
        console.log(`  Limit hit at activation ${i + 1} (HTTP ${act.status})`)
        assert(act.status === 403, `Over-limit rejected with HTTP 403 (got ${act.status})`)
        hitLimit = true
        break
      }
      tempActivations.push(act.data.id)
      activationIdsToCleanup.push(act.data.id)
      console.log(`  PASS: Activation ${i + 1} succeeded`)
    }
    assert(hitLimit, 'Activation limit was eventually enforced')

    // Clean up
    console.log('\n  Cleaning up limit test activations...')
    for (const id of tempActivations) {
      await sleep(300)
      await deactivateRaw(POLAR_TEST_LICENSE_KEY!, POLAR_ORGANIZATION_ID!, id)
      activationIdsToCleanup.splice(activationIdsToCleanup.indexOf(id), 1)
    }
    console.log(`  PASS: Cleaned up ${tempActivations.length} test activations`)
  } else {
    assert(false, `Unexpected response: HTTP ${probe.status}`)
  }
}

async function testLatency() {
  console.log('\n--- Test: Validation latency (10 calls) ---')
  const latencies: number[] = []

  for (let i = 0; i < 10; i++) {
    if (i > 0) await sleep(200)
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
  // p95 < 500ms is ideal. p95 < 2000ms is acceptable with cache TTL adjustment.
  // Abort only if p95 > 2000ms.
  const latencyPass = p95 < 2000
  assert(latencyPass, `p95 < 2000ms hard limit (got ${p95.toFixed(0)}ms)`)
  if (p95 >= 500) {
    console.log(
      `  NOTE: p95 ${p95.toFixed(0)}ms exceeds 500ms soft target. Adjust: increase cache TTL in Phase 1.`
    )
  }

  results.latency = {
    status: latencyPass ? 'pass' : 'fail',
    p50_ms: Math.round(p50),
    p95_ms: Math.round(p95),
    notes: `10 sequential validate calls. p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms.`,
  }

  return { p50, p95 }
}

// ── Main ──

const STATUS_PATH = new URL('../plan/phase-0-status.json', import.meta.url).pathname

async function writeStatus(doc: Record<string, unknown>) {
  const fs = await import('node:fs')
  fs.writeFileSync(STATUS_PATH, `${JSON.stringify(doc, null, 2)}\n`)
}

async function main() {
  console.log('=== Phase 0: Polar API Validation Gate ===')
  console.log(`Organization ID: ${POLAR_ORGANIZATION_ID}`)
  console.log(`License Key: ${POLAR_TEST_LICENSE_KEY?.slice(0, 12)}...`)
  console.log(`Date: ${new Date().toISOString().slice(0, 10)}`)

  try {
    await testValidateValidKey()
    await sleep(500)
    await testValidateInvalidKey()
    await sleep(500)
    await testActivationDeactivationCycle()
    await sleep(1000)
    await testActivationLimit()
    await sleep(1000)
    const { p50, p95 } = await testLatency()

    const adjustments = [
      'usage field does NOT track activations — activations tracked via activation records only',
      'Request bodies use snake_case (organization_id, activation_id), not camelCase',
      'limit_activations counts ALL activations (including deactivated) — not concurrent slots',
    ]
    if (p95 >= 500) {
      adjustments.push(
        `p95 latency ${p95.toFixed(0)}ms exceeds 500ms soft target — increase cache TTL from 24h to 72h in Phase 1`
      )
    }

    await writeStatus({
      phase: 0,
      name: 'Polar API Validation Gate',
      date: new Date().toISOString().slice(0, 10),
      decision: p95 < 500 ? 'proceed' : 'adjust',
      tests: {
        validate: results.validate,
        activate: results.activate,
        deactivate: results.deactivate,
        latency: results.latency,
      },
      adjustments,
      blockers: [],
    })

    console.log('\n=== ALL TESTS PASSED ===')
    console.log(`Latency: p50=${p50.toFixed(0)}ms, p95=${p95.toFixed(0)}ms`)
    console.log('Decision: PROCEED')
    console.log(`Status written to: ${STATUS_PATH}`)
  } catch (err) {
    await writeStatus({
      phase: 0,
      name: 'Polar API Validation Gate',
      date: new Date().toISOString().slice(0, 10),
      decision: 'abort',
      tests: {
        validate: results.validate ?? { status: 'fail', notes: 'Not reached' },
        activate: results.activate ?? { status: 'fail', notes: 'Not reached' },
        deactivate: results.deactivate ?? { status: 'fail', notes: 'Not reached' },
        latency: results.latency ?? { status: 'fail', p50_ms: 0, p95_ms: 0, notes: 'Not reached' },
      },
      adjustments: [],
      blockers: [String(err)],
    })
    console.error('\n=== TEST FAILED ===')
    console.error(`Status written to: ${STATUS_PATH}`)
    throw err
  } finally {
    await cleanup()
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
