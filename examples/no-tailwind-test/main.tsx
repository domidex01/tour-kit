import React from 'react'
import ReactDOM from 'react-dom/client'

// Import TourKit CSS (no Tailwind needed!)
import '@tour-kit/react/styles.css'
import '@tour-kit/react/components.css'
import '@tour-kit/hints/styles.css'

import { Hint, HintsProvider, useHints } from '@tour-kit/hints'
import { Tour, TourStep, useTour } from '@tour-kit/react'

function DemoContent() {
  const { start } = useTour('demo-tour')
  const { resetAllHints } = useHints()

  return (
    <div className="container">
      <header>
        <h1 id="title">TourKit - No Tailwind Demo</h1>
        <div>
          <button type="button" className="btn btn-secondary" onClick={() => resetAllHints()}>
            Reset Hints
          </button>
          <button type="button" className="btn btn-primary" onClick={() => start()}>
            Start Tour
          </button>
        </div>
      </header>

      <section className="cards">
        <div id="feature-1" className="card">
          <h2>Feature One</h2>
          <p>This is the first feature. TourKit works without Tailwind!</p>
        </div>

        <div id="feature-2" className="card">
          <h2>Feature Two</h2>
          <p>CSS variables provide all the styling you need.</p>
        </div>

        <div id="feature-3" className="card">
          <h2>Feature Three</h2>
          <p>Customize with your own CSS or override the variables.</p>
        </div>
      </section>

      <section id="cta" className="cta">
        <h2>Ready to get started?</h2>
        <p>Click "Start Tour" to see TourKit in action - no Tailwind required!</p>
      </section>

      {/* Hints */}
      <Hint
        id="feature-1-hint"
        target="#feature-1"
        content="This hint works without Tailwind!"
        position="top-right"
        tooltipPlacement="left"
        pulse
        persist
      />
      <Hint
        id="feature-2-hint"
        target="#feature-2"
        content="Pure CSS variables power the styling."
        position="top-right"
        tooltipPlacement="left"
        pulse
        persist
      />
    </div>
  )
}

function App() {
  return (
    <HintsProvider>
      <Tour
        id="demo-tour"
        onComplete={() => console.log('Tour completed!')}
        onSkip={() => console.log('Tour skipped!')}
      >
        <TourStep
          id="welcome"
          target="#title"
          title="Welcome!"
          content="This demo proves TourKit works without Tailwind CSS."
          placement="bottom"
        />
        <TourStep
          id="feature-1"
          target="#feature-1"
          title="Feature One"
          content="The tour card uses CSS variables with sensible defaults."
          placement="bottom"
        />
        <TourStep
          id="feature-2"
          target="#feature-2"
          title="Feature Two"
          content="No postcss.config.js or tailwind.config.js needed!"
          placement="bottom"
        />
        <TourStep
          id="feature-3"
          target="#feature-3"
          title="Feature Three"
          content="Just import the CSS files and you're ready to go."
          placement="bottom"
        />
        <TourStep
          id="cta"
          target="#cta"
          title="That's it!"
          content="TourKit is now fully functional without Tailwind. Click Finish!"
          placement="top"
        />
        <DemoContent />
      </Tour>
    </HintsProvider>
  )
}

const rootElement = document.getElementById('root')
if (!rootElement) throw new Error('Root element not found')
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
