/**
 * Preserve-bucket contract test (refactor train phase 2).
 *
 * The phase-2 plan classifies several license warnings as "preserve" —
 * loud-by-design messages that MUST bypass logger.configure({ level: 'silent' })
 * so an accidental misconfiguration cannot mute the SDK's enforcement
 * surface. This file pins the contract: configure the logger silent,
 * trigger each preserved site, and assert console still fired.
 *
 * If a future maintainer "fixes" any of these to route through logger,
 * the corresponding test fails — that's the gate.
 */

import { render } from '@testing-library/react'
import { logger } from '@tour-kit/core'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseTestMode } from '../components/license-test-mode'
import { LicenseWarning } from '../components/license-warning'

describe('License preserve-bucket warnings bypass logger.configure', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>
  let errorSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
    logger.configure({ level: 'silent' })
  })

  afterEach(() => {
    warnSpy.mockRestore()
    errorSpy.mockRestore()
    logger.configure({ level: 'warn' })
    vi.unstubAllEnvs()
  })

  it('<LicenseTestMode> still warns in production under logger.silent', () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(
      <LicenseTestMode tier="invalid">
        <div />
      </LicenseTestMode>
    )
    const matched = warnSpy.mock.calls.filter((c: unknown[]) =>
      String(c[0] ?? '').includes('<LicenseTestMode> active in production')
    )
    expect(matched.length).toBeGreaterThanOrEqual(1)
  })

  it('<LicenseWarning> still warns in dev under logger.silent', () => {
    vi.stubEnv('NODE_ENV', 'development')
    render(<LicenseWarning />)
    const matched = warnSpy.mock.calls.filter((c: unknown[]) =>
      String(c[0] ?? '').includes('Tour Kit Pro without a valid license')
    )
    expect(matched.length).toBeGreaterThanOrEqual(1)
  })
})
