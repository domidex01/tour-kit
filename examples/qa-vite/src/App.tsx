import { AiChatPanel, AiChatProvider, AiChatToggle } from '@tour-kit/ai'
import {
  type AnalyticsPlugin,
  AnalyticsProvider,
  amplitudePlugin,
  consolePlugin,
  googleAnalyticsPlugin,
  mixpanelPlugin,
  posthogPlugin,
  useAnalytics,
} from '@tour-kit/analytics'
import { type ChecklistConfig, ChecklistLauncher, ChecklistProvider } from '@tour-kit/checklists'
import { HintsProvider } from '@tour-kit/hints'
import { LicenseProvider } from '@tour-kit/license'
import {
  MultiTourKitProvider,
  Tour,
  TourCard,
  TourOverlay,
  TourStep,
  createReactRouterAdapter,
  useTour,
  useTours,
} from '@tour-kit/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import {
  AdoptionPage,
  AiChatPage,
  BaseUIPage,
  BranchingPage,
  ContactPage,
  FeaturesPage,
  HomePage,
  LicenseTestPage,
  MediaPage,
  PricingPage,
  SurveysPage,
} from './pages'

// Load Google Analytics script dynamically
function useGoogleAnalytics() {
  useEffect(() => {
    const measurementId = import.meta.env.VITE_GA_MEASUREMENT_ID
    if (!measurementId) return

    // Check if already loaded
    if (window.gtag) return

    // Load gtag.js script
    const script = document.createElement('script')
    script.src = `https://www.googletagmanager.com/gtag/js?id=${measurementId}`
    script.async = true
    document.head.appendChild(script)

    // Initialize gtag
    window.dataLayer = window.dataLayer || []
    const gtag = (...args: unknown[]) => {
      window.dataLayer.push(args)
    }
    window.gtag = gtag as unknown as typeof window.gtag
    gtag('js', new Date())
    gtag('config', measurementId)
  }, [])
}

// Extend Window interface for dataLayer (gtag is already declared in @tour-kit/analytics)
declare global {
  interface Window {
    dataLayer: unknown[]
  }
}

// Create the adapter hook with React Router hooks
const useReactRouter = createReactRouterAdapter(useLocation, useNavigate)

// Build analytics plugins array based on available environment variables
function getAnalyticsPlugins(): AnalyticsPlugin[] {
  const plugins: AnalyticsPlugin[] = [
    // Always include console plugin for development debugging
    consolePlugin({ prefix: '🎯 TourKit Demo' }),
  ]

  // PostHog
  if (import.meta.env.VITE_POSTHOG_API_KEY) {
    plugins.push(
      posthogPlugin({
        apiKey: import.meta.env.VITE_POSTHOG_API_KEY,
      })
    )
  }

  // Mixpanel
  if (import.meta.env.VITE_MIXPANEL_TOKEN) {
    plugins.push(
      mixpanelPlugin({
        token: import.meta.env.VITE_MIXPANEL_TOKEN,
        debug: true,
      })
    )
  }

  // Amplitude
  if (import.meta.env.VITE_AMPLITUDE_API_KEY) {
    plugins.push(
      amplitudePlugin({
        apiKey: import.meta.env.VITE_AMPLITUDE_API_KEY,
      })
    )
  }

  // Google Analytics (requires gtag script in index.html)
  if (import.meta.env.VITE_GA_MEASUREMENT_ID) {
    plugins.push(
      googleAnalyticsPlugin({
        measurementId: import.meta.env.VITE_GA_MEASUREMENT_ID,
      })
    )
  }

  return plugins
}

// Analytics configuration with all available plugins
const analyticsConfig = {
  plugins: getAnalyticsPlugins(),
  debug: true,
}

// Onboarding checklist configuration
const onboardingChecklist: ChecklistConfig = {
  id: 'onboarding',
  title: 'Getting Started',
  description: 'Complete these steps to get the most out of TourKit',
  tasks: [
    {
      id: 'take-tour',
      title: 'Take the product tour',
      description: 'Learn the basics with our interactive tour',
      action: { type: 'tour', tourId: 'product-tour' },
      completedWhen: { tourCompleted: 'product-tour' },
    },
    {
      id: 'explore-features',
      title: 'Explore features',
      description: 'Check out what TourKit can do',
      action: { type: 'navigate', url: '/features' },
    },
    {
      id: 'view-pricing',
      title: 'View pricing plans',
      description: 'See our pricing options',
      action: { type: 'navigate', url: '/pricing' },
    },
    {
      id: 'try-adoption',
      title: 'Try feature adoption',
      description: 'See how feature adoption tracking works',
      action: { type: 'navigate', url: '/adoption' },
    },
  ],
}

function ChecklistWrapper({ children }: { children: React.ReactNode }) {
  const { start: startTour } = useTour('product-tour')
  const { isTourCompleted } = useTours()

  return (
    <ChecklistProvider
      checklists={[onboardingChecklist]}
      persistence={{ enabled: true, storage: 'localStorage' }}
      onTaskAction={(_checklistId: string, _taskId: string, action: unknown) => {
        if (action && typeof action === 'object' && 'type' in action) {
          const taskAction = action as { type: string; tourId?: string }
          if (taskAction.type === 'tour' && taskAction.tourId === 'product-tour') {
            startTour()
          }
        }
      }}
      context={{
        completedTours: isTourCompleted('product-tour') ? ['product-tour'] : [],
      }}
    >
      {children}
      <ChecklistLauncher checklistId="onboarding" position="bottom-right" />
    </ChecklistProvider>
  )
}

function AppContent() {
  const router = useReactRouter()
  const analytics = useAnalytics()

  return (
    <MultiTourKitProvider
      router={router}
      routePersistence={{ enabled: true, storage: 'sessionStorage' }}
      onTourStart={(tourId) => {
        analytics.tourStarted(tourId, 8) // 8 steps in the product tour
      }}
      onTourComplete={(tourId) => {
        analytics.tourCompleted(tourId)
      }}
      onTourSkip={(tourId, stepIndex) => {
        analytics.tourSkipped(tourId, stepIndex)
      }}
      onStepView={(tourId, stepId, stepIndex) => {
        analytics.stepViewed(tourId, stepId, stepIndex, 8)
      }}
    >
      {/* Demo tour for conditional logic (when) and wait-for-action (advanceOn) */}
      <Tour id="conditional-demo">
        <TourStep
          id="conditional-intro"
          route="/"
          target="#hero-title"
          title="Conditional Steps Demo"
          content="This tour demonstrates conditional steps (when) and wait-for-action (advanceOn) features."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="click-to-continue"
          route="/"
          target="#start-tour-btn"
          title="Click to Continue"
          content="Click the 'Start Tour' button below to advance to the next step. This demonstrates advanceOn with click events."
          placement="bottom"
          waitForTarget
          advanceOn={{ event: 'click', selector: '#start-tour-btn' }}
        />
        <TourStep
          id="conditional-features"
          route="/features"
          target="#features-header"
          title="Conditional Step"
          content="This step only shows when the tour data has 'showAdvanced' set to true. It was skipped if you didn't set it!"
          placement="bottom"
          waitForTarget
          when={(ctx) => ctx.data.showAdvanced === true}
        />
        <TourStep
          id="conditional-complete"
          route="/features"
          target="#feature-multipage"
          title="Demo Complete!"
          content="You've seen how conditional steps and wait-for-action work. Use 'when' for conditional visibility and 'advanceOn' for automatic advancement."
          placement="bottom"
          waitForTarget
        />
      </Tour>

      {/* Branching demo tour */}
      <Tour id="branching-demo">
        <TourStep
          id="welcome"
          route="/branching"
          target="#branching-title"
          title="Dynamic Branching"
          content="This tour demonstrates personalized flows based on your choices. Tours can adapt to user decisions!"
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="role-select"
          route="/branching"
          target="#role-select"
          title="Select Your Role"
          content="Click one of the role buttons below to choose your path. Each role shows different content."
          placement="bottom"
          waitForTarget
          interactive
          onNext={null}
          onAction={{
            developer: 'dev-intro',
            designer: 'design-intro',
            manager: 'manager-intro',
          }}
        />
        {/* Developer path */}
        <TourStep
          id="dev-intro"
          route="/branching"
          target="#developer-section"
          title="Developer Track"
          content="Welcome to the developer path! Here you'll find API docs, code examples, and integration guides."
          placement="right"
          waitForTarget
          onNext="summary"
          onPrev="role-select"
        />
        {/* Designer path */}
        <TourStep
          id="design-intro"
          route="/branching"
          target="#designer-section"
          title="Designer Track"
          content="Welcome to the designer path! Explore visual tools, themes, and component styling options."
          placement="right"
          waitForTarget
          onNext="summary"
          onPrev="role-select"
        />
        {/* Manager path */}
        <TourStep
          id="manager-intro"
          route="/branching"
          target="#manager-section"
          title="Manager Track"
          content="Welcome to the manager path! Learn about analytics, team features, and performance metrics."
          placement="right"
          waitForTarget
          onNext="summary"
          onPrev="role-select"
        />
        {/* Summary */}
        <TourStep
          id="summary"
          route="/branching"
          target="#branching-title"
          title="Tour Complete!"
          content="You completed the branching tour. Try again with a different role to see other content!"
          placement="bottom"
          waitForTarget
          onNext="complete"
        />
      </Tour>

      {/* Multi-page product tour */}
      <Tour id="product-tour">
        {/* Home page steps */}
        <TourStep
          id="welcome"
          route="/"
          target="#hero-title"
          title="Welcome to TourKit!"
          content="This is a multi-page tour demo using React Router. We'll guide you through different pages of the app."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="nav-intro"
          route="/"
          target="#main-nav"
          title="Navigation"
          content="Use these links to navigate between pages. The tour will follow you!"
          placement="bottom"
          waitForTarget
        />

        {/* Features page steps */}
        <TourStep
          id="features-intro"
          route="/features"
          target="#features-header"
          title="Features Page"
          content="We've automatically navigated you to the Features page. Let's explore what TourKit can do."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="feature-multipage"
          route="/features"
          target="#feature-multipage"
          title="Multi-Page Tours"
          content="Tours can span multiple pages and automatically navigate between them."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="feature-persistence"
          route="/features"
          target="#feature-persistence"
          title="State Persistence"
          content="Tour progress is saved, so users can refresh or return later."
          placement="bottom"
          waitForTarget
        />

        {/* Pricing page steps */}
        <TourStep
          id="pricing-intro"
          route="/pricing"
          target="#pricing-header"
          title="Pricing Page"
          content="Now let's check out the pricing options."
          placement="bottom"
          waitForTarget
        />
        <TourStep
          id="pricing-free"
          route="/pricing"
          target="#plan-free"
          title="Free Plan"
          content="TourKit is open source and free to use!"
          placement="right"
          waitForTarget
        />

        {/* Contact page step */}
        <TourStep
          id="contact-final"
          route="/contact"
          target="#contact-form"
          title="Get in Touch"
          content="That's the end of our multi-page tour! Feel free to reach out with questions."
          placement="top"
          waitForTarget
        />
      </Tour>

      <ChecklistWrapper>
        <HintsProvider>
          <Layout>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/features" element={<FeaturesPage />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/adoption" element={<AdoptionPage />} />
              <Route path="/branching" element={<BranchingPage />} />
              <Route path="/base-ui" element={<BaseUIPage />} />
              <Route path="/media" element={<MediaPage />} />
              <Route path="/surveys" element={<SurveysPage />} />
              <Route path="/ai-chat" element={<AiChatPage />} />
              <Route path="/license-test" element={<LicenseTestPage />} />
            </Routes>
          </Layout>
        </HintsProvider>
      </ChecklistWrapper>

      <TourOverlay />
      <TourCard />
      <AiChatPanel position="bottom-left" title="Help Assistant" emptyState="How can I help you?" />
      <AiChatToggle position="bottom-left" />
    </MultiTourKitProvider>
  )
}

function App() {
  // Load Google Analytics if configured
  useGoogleAnalytics()

  const location = useLocation()

  // License test page renders outside the main LicenseProvider
  // so "no-provider" scenario actually has no provider in the tree
  if (location.pathname === '/license-test') {
    return <LicenseTestPage />
  }

  return (
    <LicenseProvider
      organizationId={import.meta.env.VITE_POLAR_ORG_ID ?? ''}
      licenseKey={import.meta.env.VITE_TOUR_KIT_LICENSE_KEY ?? ''}
    >
      <AiChatProvider
        config={{
          endpoint: '/api/chat',
          suggestions: {
            static: ['How do I get started?', 'What features are available?', 'How do tours work?'],
          },
        }}
      >
        <AnalyticsProvider config={analyticsConfig}>
          <AppContent />
        </AnalyticsProvider>
      </AiChatProvider>
    </LicenseProvider>
  )
}

export default App
