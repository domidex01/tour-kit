import { render } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { LicenseTestMode } from '../components/license-test-mode'

describe('<LicenseTestMode> production warning', () => {
  let warnSpy: ReturnType<typeof vi.spyOn>

  beforeEach(() => {
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    warnSpy.mockRestore()
    vi.unstubAllEnvs()
  })

  it('warns exactly once in production with the documented substring', () => {
    vi.stubEnv('NODE_ENV', 'production')
    render(
      <LicenseTestMode tier="invalid">
        <div />
      </LicenseTestMode>
    )
    const productionCalls = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('<LicenseTestMode> active in production')
    )
    expect(productionCalls).toHaveLength(1)
  })

  it('does not warn in development', () => {
    vi.stubEnv('NODE_ENV', 'development')
    render(
      <LicenseTestMode tier="invalid">
        <div />
      </LicenseTestMode>
    )
    const productionCalls = warnSpy.mock.calls.filter((call) =>
      String(call[0] ?? '').includes('<LicenseTestMode> active in production')
    )
    expect(productionCalls).toHaveLength(0)
  })
})
