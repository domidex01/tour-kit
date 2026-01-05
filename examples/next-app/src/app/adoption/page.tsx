'use client'

import {
  AdoptionDashboard,
  AdoptionNudge,
  AdoptionProvider,
  type Feature,
  FeatureButton,
  IfAdopted,
  IfNotAdopted,
  NewFeatureBadge,
  useAdoptionAnalytics,
  useFeature,
} from '@tour-kit/adoption'

// Define features to track
const features: Feature[] = [
  {
    id: 'export',
    name: 'Export Data',
    trigger: '#export-btn',
    description: 'Export your data to CSV or JSON format',
    category: 'data',
    adoptionCriteria: { minUses: 2, recencyDays: 30 },
    priority: 1,
  },
  {
    id: 'dark-mode',
    name: 'Dark Mode',
    trigger: '#dark-mode-btn',
    description: 'Switch to dark mode for better visibility',
    category: 'settings',
    adoptionCriteria: { minUses: 1 },
    priority: 2,
  },
  {
    id: 'keyboard-shortcuts',
    name: 'Keyboard Shortcuts',
    trigger: '#shortcuts-btn',
    description: 'Use keyboard shortcuts for faster navigation',
    category: 'productivity',
    adoptionCriteria: { minUses: 3 },
    priority: 3,
    premium: true,
  },
  {
    id: 'ai-assistant',
    name: 'AI Assistant',
    trigger: '#ai-btn',
    description: 'Get help from our AI-powered assistant',
    category: 'productivity',
    adoptionCriteria: { minUses: 2 },
    priority: 4,
    premium: true,
  },
]

function FeatureCard({ featureId }: { featureId: string }) {
  const { feature, usage, trackUsage, isAdopted } = useFeature(featureId)

  if (!feature) return null

  return (
    <div className="p-6 rounded-lg border bg-popover shadow-sm relative">
      {feature.premium && (
        <span className="absolute top-2 right-2 px-2 py-0.5 bg-purple-100 text-purple-800 text-xs rounded-full">
          Premium
        </span>
      )}

      <h3 className="text-lg font-semibold mb-2 flex items-center gap-2">
        {feature.name}
        <IfNotAdopted featureId={featureId}>
          <NewFeatureBadge featureId={featureId} text="New" />
        </IfNotAdopted>
      </h3>

      <p className="text-muted-foreground mb-4">{feature.description}</p>

      <div className="flex items-center justify-between">
        <FeatureButton
          id={`${featureId}-btn`}
          featureId={featureId}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
        >
          {isAdopted ? 'Use Feature' : 'Try It'}
        </FeatureButton>

        <div className="text-sm text-muted-foreground">
          Used {usage.useCount} time{usage.useCount !== 1 ? 's' : ''}
        </div>
      </div>

      <IfAdopted featureId={featureId}>
        <div className="mt-3 text-sm text-green-600 flex items-center gap-1">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path
              fillRule="evenodd"
              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Feature Adopted!
        </div>
      </IfAdopted>
    </div>
  )
}

function NudgeDemo() {
  return (
    <div className="p-6 rounded-lg border bg-popover shadow-sm">
      <h2 className="text-xl font-semibold mb-4">Nudge Components</h2>
      <p className="text-muted-foreground mb-4">
        Nudges appear to encourage users to try features they haven't adopted yet.
      </p>

      <AdoptionNudge
        render={({ feature, onDismiss, onSnooze }) => (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start justify-between">
              <div>
                <h4 className="font-medium text-blue-900">Try {feature.name}!</h4>
                <p className="text-sm text-blue-700 mt-1">{feature.description}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => onSnooze(1000 * 60 * 60)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Later
                </button>
                <button
                  type="button"
                  onClick={onDismiss}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}
      />
    </div>
  )
}

function AdoptionPageContent() {
  const adoptionAnalytics = useAdoptionAnalytics()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        <header id="adoption-header" className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Feature Adoption Demo</h1>
          <p className="text-muted-foreground">
            Track which features users discover and adopt over time
          </p>
          {adoptionAnalytics.isAvailable && (
            <p className="text-sm text-green-600 mt-2">Analytics connected - events are tracked</p>
          )}
        </header>

        {/* Dashboard with stats, table, and chart */}
        <AdoptionDashboard showStats showTable showChart showFilters />

        <section>
          <h2 className="text-xl font-semibold mb-4">Try These Features</h2>
          <p className="text-muted-foreground mb-4">
            Click the buttons below to track feature usage. Features become "adopted" after meeting
            their adoption criteria.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {features.map((f) => (
              <FeatureCard key={f.id} featureId={f.id} />
            ))}
          </div>
        </section>

        <NudgeDemo />

        <section className="p-6 rounded-lg border bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">How It Works</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>Triggers:</strong> Features are tracked when users interact with specified
              elements (CSS selectors, events, or callbacks)
            </li>
            <li>
              <strong>Adoption Criteria:</strong> Define when a feature is "adopted" (min uses,
              recency, custom logic)
            </li>
            <li>
              <strong>Nudges:</strong> Encourage users to try features they haven't adopted yet
            </li>
            <li>
              <strong>Analytics:</strong> All events are sent to your analytics provider
            </li>
            <li>
              <strong>Persistence:</strong> Usage data is stored in localStorage by default
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function AdoptionProviderWrapper({ children }: { children: React.ReactNode }) {
  const adoptionAnalytics = useAdoptionAnalytics()

  return (
    <AdoptionProvider
      features={features}
      storage={{ type: 'localStorage', key: 'tourkit-adoption-demo' }}
      nudge={{ enabled: true, cooldown: 5000, maxPerSession: 3 }}
      onAdoption={(feature) => {
        console.log(`Feature adopted: ${feature.name}`)
        const usage = {
          featureId: feature.id,
          useCount: 0,
          firstUsed: null,
          lastUsed: null,
          status: 'adopted' as const,
        }
        adoptionAnalytics.trackAdopted(feature, usage)
      }}
      onChurn={(feature) => {
        console.log(`Feature churned: ${feature.name}`)
      }}
      onNudge={(feature, action) => {
        console.log(`Nudge ${action}: ${feature.name}`)
        if (action === 'shown') {
          adoptionAnalytics.trackNudgeShown(feature, 1)
        } else if (action === 'dismissed') {
          adoptionAnalytics.trackNudgeDismissed(feature)
        }
      }}
    >
      {children}
    </AdoptionProvider>
  )
}

export default function AdoptionPage() {
  return (
    <AdoptionProviderWrapper>
      <AdoptionPageContent />
    </AdoptionProviderWrapper>
  )
}
