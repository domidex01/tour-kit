'use client'

import { LicenseProvider } from '@tour-kit/license'
import { AllTestBlocks } from '../test-blocks'

export default function LicenseEmptyPage() {
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORG_ID ?? ''

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>License Test: Empty Key</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        LicenseProvider with empty licenseKey. Free packages render, pro packages show placeholder
        on production domains.
      </p>

      <LicenseProvider
        organizationId={orgId}
        licenseKey=""
        onValidate={(state) => console.log('[License Test] Validate:', state)}
        onError={(err) => console.error('[License Test] Error:', err)}
      >
        <AllTestBlocks />
      </LicenseProvider>
    </div>
  )
}
