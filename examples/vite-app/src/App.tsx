import { HintsProvider } from '@tour-kit/hints'
import {
  MultiTourKitProvider,
  Tour,
  TourCard,
  TourOverlay,
  TourStep,
  createReactRouterAdapter,
} from '@tour-kit/react'
import { Route, Routes, useLocation, useNavigate } from 'react-router-dom'
import { Layout } from './components/Layout'
import { ContactPage, FeaturesPage, HomePage, PricingPage } from './pages'

// Create the adapter hook with React Router hooks
const useReactRouter = createReactRouterAdapter(useLocation, useNavigate)

function AppContent() {
  const router = useReactRouter()

  return (
    <MultiTourKitProvider
      router={router}
      routePersistence={{ enabled: true, storage: 'sessionStorage' }}
      onTourComplete={(tourId) => console.log(`Tour "${tourId}" completed!`)}
      onTourSkip={(tourId, stepIndex) =>
        console.log(`Tour "${tourId}" skipped at step ${stepIndex}`)
      }
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
  return <AppContent />
}

export default App
