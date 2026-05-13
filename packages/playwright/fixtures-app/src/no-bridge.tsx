import { TourProvider } from '@tour-kit/core'
import { TourCard } from '@tour-kit/react'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { demoTour } from './_demo-tour'

const rootEl = document.getElementById('root')
if (!rootEl) {
  throw new Error('Root element not found')
}

// Intentionally omits `enableTestBridge` so `window.__tourKit__` stays
// undefined — proves the absent-by-default invariant in real Chromium.
createRoot(rootEl).render(
  <StrictMode>
    <TourProvider tours={[demoTour]}>
      <TourCard />
    </TourProvider>
  </StrictMode>
)
