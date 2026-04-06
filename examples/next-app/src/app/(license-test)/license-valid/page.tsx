'use client'

import { LicenseProvider } from '@tour-kit/license'
import { AllTestBlocks } from '../test-blocks'

export default function LicenseValidPage() {
  const orgId = process.env.NEXT_PUBLIC_POLAR_ORG_ID ?? ''
  const licenseKey = process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''
  const missingEnv = !orgId || !licenseKey

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>License Test: Valid Key</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        LicenseProvider with real Polar key. All packages should render.
      </p>

      {missingEnv && (
        <div
          data-testid="env-warning"
          style={{
            padding: '12px 16px',
            background: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '8px',
            marginBottom: '16px',
            fontSize: '13px',
            color: '#991b1b',
          }}
        >
          <strong>Missing environment variables:</strong>
          {!orgId && <span> NEXT_PUBLIC_POLAR_ORG_ID</span>}
          {!licenseKey && <span> NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY</span>}
          <br />
          The valid license scenario will behave like an empty key without these.
        </div>
      )}

      <LicenseProvider
        organizationId={orgId}
        licenseKey={licenseKey}
        onValidate={(state) => console.log('[License Test] Validate:', state)}
        onError={(err) => console.error('[License Test] Error:', err)}
      >
        <AllTestBlocks />
      </LicenseProvider>
    </div>
  )
}
