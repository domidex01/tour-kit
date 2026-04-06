/**
 * License Gate Test Page
 *
 * Tests all 11 @tour-kit/* packages across 4 license scenarios:
 * 1. Valid License — LicenseProvider with real Polar key
 * 2. Invalid Key — LicenseProvider with fake key
 * 3. No Provider — Pro components without LicenseProvider
 * 4. Empty Key — LicenseProvider with empty licenseKey
 *
 * Each test block has data-testid attributes for Playwright E2E tests.
 * On localhost the dev bypass is active (all render). On production
 * domains the gate activates (pro packages show placeholder).
 */
import { Component, type ErrorInfo, type ReactNode, useState } from 'react'

// Free packages
import { TourProvider } from '@tour-kit/core'
import { HintsProvider } from '@tour-kit/hints'
import { Tour, TourStep } from '@tour-kit/react'

// License
import { LicenseProvider } from '@tour-kit/license'

// Pro provider-gated
import { AdoptionProvider } from '@tour-kit/adoption'
import { AiChatProvider } from '@tour-kit/ai'
import { AnalyticsProvider } from '@tour-kit/analytics'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'

// Pro component-gated
import { NativeVideo, VimeoEmbed, YouTubeEmbed } from '@tour-kit/media'
import { ScheduleGate } from '@tour-kit/scheduling'

type TestScenario = 'licensed' | 'invalid-key' | 'no-provider' | 'empty-key'

const SCENARIOS: { id: TestScenario; label: string; description: string }[] = [
  {
    id: 'licensed',
    label: 'Valid License',
    description:
      'LicenseProvider with your real Polar key. On localhost: dev bypass. On production: Polar API validates.',
  },
  {
    id: 'invalid-key',
    label: 'Invalid Key',
    description:
      'LicenseProvider with a fake key. On localhost: dev bypass. On production: API returns invalid → gate blocks.',
  },
  {
    id: 'no-provider',
    label: 'No Provider',
    description:
      'Pro components without any LicenseProvider. On localhost: dev bypass. On production: gate blocks.',
  },
  {
    id: 'empty-key',
    label: 'Empty Key',
    description:
      'LicenseProvider with empty licenseKey="". On localhost: dev bypass. On production: gate blocks.',
  },
]

export function LicenseTestPage() {
  const [scenario, setScenario] = useState<TestScenario>('licensed')

  const orgId = import.meta.env.VITE_POLAR_ORG_ID ?? ''
  const validKey = import.meta.env.VITE_TOUR_KIT_LICENSE_KEY ?? ''
  const missingEnv = !orgId || !validKey

  return (
    <div
      style={{
        padding: '40px',
        fontFamily: 'system-ui, sans-serif',
        maxWidth: '900px',
        margin: '0 auto',
      }}
    >
      <h1 style={{ fontSize: '24px', marginBottom: '8px' }}>License Gate Test Page</h1>

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
          {!orgId && <span> VITE_POLAR_ORG_ID</span>}
          {!validKey && <span> VITE_TOUR_KIT_LICENSE_KEY</span>}
          <br />
          The "Valid License" scenario will behave like an empty key without these.
        </div>
      )}
      <p style={{ color: '#6b7280', marginBottom: '24px', fontSize: '14px' }}>
        Tests all 11 @tour-kit packages across 4 license scenarios. Open DevTools console for
        validation logs.
      </p>

      {/* Scenario selector */}
      <div
        style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}
        data-testid="scenario-selector"
      >
        {SCENARIOS.map((s) => (
          <button
            key={s.id}
            data-testid={`scenario-selector-${s.id}`}
            onClick={() => setScenario(s.id)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              border: scenario === s.id ? '2px solid #2563eb' : '1px solid #d1d5db',
              background: scenario === s.id ? '#eff6ff' : '#fff',
              fontWeight: scenario === s.id ? 600 : 400,
              cursor: 'pointer',
              fontSize: '13px',
            }}
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* Scenario description */}
      <div
        style={{
          padding: '12px 16px',
          background: '#f3f4f6',
          borderRadius: '8px',
          marginBottom: '24px',
          fontSize: '14px',
        }}
        data-testid="scenario-description"
      >
        {SCENARIOS.find((s) => s.id === scenario)?.description}
      </div>

      {/* Test blocks */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '4px' }}>
          Free Packages (3)
        </h2>

        {scenario === 'licensed' && (
          <LicenseProvider
            key="licensed"
            organizationId={orgId}
            licenseKey={validKey}
            onValidate={(state) => console.log('[License Test] Validate:', state)}
            onError={(err) => console.error('[License Test] Error:', err)}
          >
            <AllTestBlocks />
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
            <AllTestBlocks />
          </LicenseProvider>
        )}

        {scenario === 'no-provider' && <AllTestBlocks />}

        {scenario === 'empty-key' && (
          <LicenseProvider
            key="empty"
            organizationId={orgId}
            licenseKey=""
            onValidate={(state) => console.log('[License Test] Validate:', state)}
            onError={(err) => console.error('[License Test] Error:', err)}
          >
            <AllTestBlocks />
          </LicenseProvider>
        )}
      </div>

      {/* Console hint */}
      <div
        style={{
          marginTop: '32px',
          padding: '12px 16px',
          background: '#fefce8',
          borderRadius: '8px',
          fontSize: '13px',
        }}
      >
        Open your browser DevTools console to see license validation logs and ProGate error messages.
      </div>
    </div>
  )
}

function AllTestBlocks() {
  return (
    <>
      {/* FREE PACKAGES */}
      <TestBlock testId="core" pkg="@tour-kit/core" type="free">
        <TourProvider>
          <div>TourProvider rendered</div>
        </TourProvider>
      </TestBlock>

      <TestBlock testId="react" pkg="@tour-kit/react" type="free">
        <Tour id="license-test">
          <TourStep id="step-1" target="#test-btn" content="Hello" />
        </Tour>
        <div>Tour + TourStep rendered</div>
      </TestBlock>

      <TestBlock testId="hints" pkg="@tour-kit/hints" type="free">
        <HintsProvider>
          <div>HintsProvider rendered</div>
        </HintsProvider>
      </TestBlock>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '4px' }}>
        Pro Provider-Gated (5)
      </h2>

      {/* PRO PROVIDER-GATED */}
      <TestBlock testId="adoption" pkg="@tour-kit/adoption" type="pro">
        <AdoptionProvider features={[]}>
          <div>AdoptionProvider rendered</div>
        </AdoptionProvider>
      </TestBlock>

      <TestBlock testId="ai" pkg="@tour-kit/ai" type="pro">
        <AiChatProvider config={{ endpoint: '/api/chat' }}>
          <div>AiChatProvider rendered</div>
        </AiChatProvider>
      </TestBlock>

      <TestBlock testId="analytics" pkg="@tour-kit/analytics" type="pro">
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>AnalyticsProvider rendered</div>
        </AnalyticsProvider>
      </TestBlock>

      <TestBlock testId="announcements" pkg="@tour-kit/announcements" type="pro">
        <AnnouncementsProvider>
          <div>AnnouncementsProvider rendered</div>
        </AnnouncementsProvider>
      </TestBlock>

      <TestBlock testId="checklists" pkg="@tour-kit/checklists" type="pro">
        <ChecklistProvider checklists={[]}>
          <div>ChecklistProvider rendered</div>
        </ChecklistProvider>
      </TestBlock>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '4px' }}>
        Pro Component-Gated (3)
      </h2>

      {/* PRO COMPONENT-GATED */}
      <TestBlock testId="media-youtube" pkg="@tour-kit/media" type="pro">
        <YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test YouTube Video" />
      </TestBlock>

      <TestBlock testId="media-vimeo" pkg="@tour-kit/media" type="pro">
        <VimeoEmbed videoId="76979871" title="Test Vimeo Video" />
      </TestBlock>

      <TestBlock testId="media-native" pkg="@tour-kit/media" type="pro">
        <NativeVideo src="https://www.w3schools.com/html/mov_bbb.mp4" alt="Test native video" />
      </TestBlock>

      <TestBlock testId="scheduling" pkg="@tour-kit/scheduling" type="pro">
        <ScheduleGate>
          <div>ScheduleGate rendered</div>
        </ScheduleGate>
      </TestBlock>
    </>
  )
}

// --- TestBlock ---

function TestBlock({
  testId,
  pkg,
  type,
  children,
}: {
  testId: string
  pkg: string
  type: 'free' | 'pro'
  children: ReactNode
}) {
  return (
    <div
      data-testid={`test-block-${testId}`}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          background: type === 'free' ? '#ecfdf5' : '#eff6ff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <code style={{ fontSize: '13px', fontWeight: 600 }}>{pkg}</code>
        <span
          data-testid={`test-badge-${testId}`}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: type === 'free' ? '#d1fae5' : '#dbeafe',
            color: type === 'free' ? '#065f46' : '#1e40af',
          }}
        >
          {type === 'free' ? 'FREE' : 'PRO'}
        </span>
      </div>
      <div style={{ padding: '16px' }} data-testid={`test-content-${testId}`}>
        <ErrorBoundary
          fallback={<div data-testid={`test-error-${testId}`}>Component error</div>}
        >
          {children}
        </ErrorBoundary>
      </div>
    </div>
  )
}

// --- ErrorBoundary ---

interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[License Test] Component error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
