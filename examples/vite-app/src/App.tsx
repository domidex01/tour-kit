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
import { HintsProvider } from '@tour-kit/hints'
import {
  MultiTourKitProvider,
  Tour,
  TourCard,
  TourOverlay,
  TourStep,
  createReactRouterAdapter,
} from '@tour-kit/react'
import { useEffect } from 'react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ContactPage, FeaturesPage, HomePage, PricingPage } from './pages'

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
    function gtag(...args: unknown[]) {
      window.dataLayer.push(args)
    }
    window.gtag = gtag
    gtag('js', new Date())
    gtag('config', measurementId)
  }, [])
}

// Extend Window interface for gtag
declare global {
  interface Window {
    dataLayer: unknown[]
    gtag: (...args: unknown[]) => void
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

      <HintsProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/features" element={<FeaturesPage />} />
            <Route path="/pricing" element={<PricingPage />} />
            <Route path="/contact" element={<ContactPage />} />
          </Routes>
        </Layout>
      </HintsProvider>

      <TourOverlay />
      <TourCard />
    </MultiTourKitProvider>
  )
}

function App() {
  // Load Google Analytics if configured
  useGoogleAnalytics()

  return (
    <AnalyticsProvider config={analyticsConfig}>
      <AppContent />
    </AnalyticsProvider>
  )
}

export default App
