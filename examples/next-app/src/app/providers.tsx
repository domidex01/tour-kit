'use client'

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
  createNextAppRouterAdapter,
} from '@tour-kit/react'
import { usePathname, useRouter } from 'next/navigation'

// Create the adapter hook with Next.js navigation hooks
const useNextAppRouter = createNextAppRouterAdapter(usePathname, useRouter)

// Build analytics plugins array based on available environment variables
function getAnalyticsPlugins(): AnalyticsPlugin[] {
  const plugins: AnalyticsPlugin[] = [
    // Always include console plugin for development debugging
    consolePlugin({ prefix: '🎯 TourKit Next.js' }),
  ]

  // PostHog
  if (process.env.NEXT_PUBLIC_POSTHOG_API_KEY) {
    plugins.push(
      posthogPlugin({
        apiKey: process.env.NEXT_PUBLIC_POSTHOG_API_KEY,
      })
    )
  }

  // Mixpanel
  if (process.env.NEXT_PUBLIC_MIXPANEL_TOKEN) {
    plugins.push(
      mixpanelPlugin({
        token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN,
        debug: true,
      })
    )
  }

  // Amplitude
  if (process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY) {
    plugins.push(
      amplitudePlugin({
        apiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY,
      })
    )
  }

  // Google Analytics (requires gtag script in layout)
  if (process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID) {
    plugins.push(
      googleAnalyticsPlugin({
        measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID,
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

function ProvidersInner({ children }: { children: React.ReactNode }) {
  const router = useNextAppRouter()
  const analytics = useAnalytics()

  return (
    <MultiTourKitProvider
      router={router}
      routePersistence={{ enabled: true, storage: 'sessionStorage' }}
      onTourStart={(tourId) => {
        analytics.tourStarted(tourId, 8) // 8 steps in the onboarding tour
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
      {/* Multi-page onboarding tour */}
      <Tour id="onboarding-tour">
        {/* Home page steps */}
        <TourStep
          id="welcome"
          route="/"
          target="#hero-title"
          title="Welcome to TourKit!"
          content="This is a multi-page tour demo. We'll guide you through different pages of the app."
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

      <HintsProvider>{children}</HintsProvider>
      <TourOverlay />
      <TourCard />
    </MultiTourKitProvider>
  )
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AnalyticsProvider config={analyticsConfig}>
      <ProvidersInner>{children}</ProvidersInner>
    </AnalyticsProvider>
  )
}
