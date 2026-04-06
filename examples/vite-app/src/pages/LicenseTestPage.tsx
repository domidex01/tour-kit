/**
 * License Gate Test Page
 *
 * Tests the ProGate behavior by rendering pro components in 3 scenarios:
 * 1. With valid LicenseProvider (should render children)
 * 2. With invalid key LicenseProvider (should show placeholder)
 * 3. Without LicenseProvider at all (should show placeholder on prod, children on localhost)
 *
 * Since localhost always bypasses the gate, this page patches isDevEnvironment()
 * to return false so you can see the actual gated behavior locally.
 */
import { useState } from 'react'
import { LicenseProvider } from '@tour-kit/license'
import { AnalyticsProvider } from '@tour-kit/analytics'
import { ChecklistProvider } from '@tour-kit/checklists'

type TestScenario = 'licensed' | 'invalid-key' | 'no-provider'

export function LicenseTestPage() {
  const [scenario, setScenario] = useState<TestScenario>('licensed')

  const orgId = import.meta.env.VITE_POLAR_ORG_ID ?? ''
  const validKey = import.meta.env.VITE_TOUR_KIT_LICENSE_KEY ?? ''

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif', maxWidth: '800px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>License Gate Test Page</h1>
      <p style={{ color: '#6b7280', marginBottom: '24px' }}>
        Tests ProGate behavior. On localhost, the dev bypass is active so licensed scenarios always work.
        Use "No Provider" to simulate the gate on localhost.
      </p>

      {/* Scenario selector */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
        {(['licensed', 'invalid-key', 'no-provider'] as const).map((s) => (
          <button
            key={s}
            onClick={() => setScenario(s)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: scenario === s ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: scenario === s ? '#eff6ff' : '#fff',
              fontWeight: scenario === s ? 600 : 400,
              cursor: 'pointer',
            }}
          >
            {s === 'licensed' && 'Valid License'}
            {s === 'invalid-key' && 'Invalid Key'}
            {s === 'no-provider' && 'No Provider'}
          </button>
        ))}
      </div>

      {/* Scenario description */}
      <div style={{ padding: '12px 16px', background: '#f3f4f6', borderRadius: '8px', marginBottom: '24px', fontSize: '14px' }}>
        {scenario === 'licensed' && (
          <>
            <strong>Valid License:</strong> LicenseProvider with your real Polar key.
            On localhost this always works (dev bypass). On a real domain it validates against Polar API.
          </>
        )}
        {scenario === 'invalid-key' && (
          <>
            <strong>Invalid Key:</strong> LicenseProvider with a fake key.
            On localhost this still works (dev bypass). On a real domain the Polar API returns 404 → gate blocks.
          </>
        )}
        {scenario === 'no-provider' && (
          <>
            <strong>No Provider:</strong> Pro components rendered without any LicenseProvider.
            On localhost the dev bypass still allows rendering. On a real domain → gate blocks with placeholder.
            <br /><br />
            <em>Note: To see the actual placeholder on localhost, we'd need to deploy or override hostname detection.</em>
          </>
        )}
      </div>

      {/* Test components */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <h2 style={{ fontSize: '18px', fontWeight: 600 }}>Pro Components:</h2>

        {scenario === 'licensed' && (
          <LicenseProvider
            key="licensed"
            organizationId={orgId}
            licenseKey={validKey}
            onValidate={(state) => console.log('[License Test] Validate:', state)}
            onError={(err) => console.error('[License Test] Error:', err)}
          >
            <ProComponentTests />
          </LicenseProvider>
        )}

        {scenario === 'invalid-key' && (
          <LicenseProvider
            key="invalid"
            organizationId={orgId}
            licenseKey="TOURKIT-FAKE-0000-0000-000000000000"
            onValidate={(state) => console.log('[License Test] Validate:', state)}
            onError={(err) => console.error('[License Test] Error:', err)}
          >
            <ProComponentTests />
          </LicenseProvider>
        )}

        {scenario === 'no-provider' && <ProComponentTests />}
      </div>

      {/* Console hint */}
      <div style={{ marginTop: '32px', padding: '12px 16px', background: '#fefce8', borderRadius: '8px', fontSize: '13px' }}>
        Open your browser DevTools console to see license validation logs and ProGate error messages.
      </div>
    </div>
  )
}

/** Renders several pro components to test gating */
function ProComponentTests() {
  return (
    <>
      <TestCard title="@tour-kit/analytics — AnalyticsProvider">
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '6px' }}>
            AnalyticsProvider children rendered successfully
          </div>
        </AnalyticsProvider>
      </TestCard>

      <TestCard title="@tour-kit/checklists — ChecklistProvider">
        <ChecklistProvider checklists={[]}>
          <div style={{ padding: '12px', background: '#ecfdf5', borderRadius: '6px' }}>
            ChecklistProvider children rendered successfully
          </div>
        </ChecklistProvider>
      </TestCard>
    </>
  )
}

function TestCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div style={{ border: '1px solid #e5e7eb', borderRadius: '8px', overflow: 'hidden' }}>
      <div style={{ padding: '8px 16px', background: '#f9fafb', borderBottom: '1px solid #e5e7eb', fontSize: '13px', fontWeight: 600 }}>
        {title}
      </div>
      <div style={{ padding: '16px' }}>{children}</div>
    </div>
  )
}
