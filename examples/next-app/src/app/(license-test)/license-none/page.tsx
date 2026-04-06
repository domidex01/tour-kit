'use client'

import { LicenseContext } from '@tour-kit/license'
import { AllTestBlocks } from '../test-blocks'

/**
 * Simulates no LicenseProvider by overriding the context from the root
 * Providers wrapper with null. useLicenseGate treats null context as "no provider".
 */
export default function LicenseNonePage() {
  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>License Test: No Provider</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        No LicenseProvider (context overridden to null). Free packages render, pro packages show
        placeholder on production domains.
      </p>

      <LicenseContext.Provider value={null}>
        <AllTestBlocks />
      </LicenseContext.Provider>
    </div>
  )
}
