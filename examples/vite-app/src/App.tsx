import { Tour, TourStep, useTour } from '@tour-kit/react'
import { HintsProvider, Hint, useHints } from '@tour-kit/hints'

function DemoContent() {
  const { start } = useTour('demo-tour')
  const { resetAllHints } = useHints()

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 id="title" className="text-3xl font-bold text-foreground">
            TourKit Demo
          </h1>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => resetAllHints()}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
            >
              Reset Hints
            </button>
            <button
              type="button"
              onClick={() => start()}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              Start Tour
            </button>
          </div>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div id="feature-1" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Feature One</h2>
            <p className="text-muted-foreground">
              This is the first feature of our application. It does amazing things.
            </p>
          </div>

          <div id="feature-2" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Feature Two</h2>
            <p className="text-muted-foreground">
              The second feature is even better. Users love this one.
            </p>
          </div>

          <div id="feature-3" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Feature Three</h2>
            <p className="text-muted-foreground">
              And finally, the third feature completes the experience.
            </p>
          </div>
        </section>

        <section id="cta" className="p-8 rounded-lg bg-secondary text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-4">
            Click the button above to take a tour of our features.
          </p>
        </section>

        {/* Hints - persist means closing dismisses them permanently until reset */}
        <Hint
          id="feature-1-hint"
          target="#feature-1"
          content="Click here to learn about Feature One!"
          position="top-right"
          tooltipPlacement="left"
          pulse
          persist
        />
        <Hint
          id="feature-2-hint"
          target="#feature-2"
          content="Feature Two has exciting capabilities."
          position="top-right"
          tooltipPlacement="left"
          pulse
          persist
        />
        <Hint
          id="feature-3-hint"
          target="#feature-3"
          content="Feature Three completes the experience."
          position="top-right"
          tooltipPlacement="left"
          pulse
          persist
        />
      </div>
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
          title="Welcome to TourKit!"
          content="This is a demo of the TourKit library. Let's explore the features together."
          placement="bottom"
        />
        <TourStep
          id="feature-1"
          target="#feature-1"
          title="Feature One"
          content="Here's our first amazing feature. Click Next to continue."
          placement="bottom"
        />
        <TourStep
          id="feature-2"
          target="#feature-2"
          title="Feature Two"
          content="The second feature is highlighted here. Notice the spotlight effect."
          placement="bottom"
        />
        <TourStep
          id="feature-3"
          target="#feature-3"
          title="Feature Three"
          content="And here's the third feature. Almost done with the tour!"
          placement="bottom"
        />
        <TourStep
          id="cta"
          target="#cta"
          title="Get Started"
          content="That's it! You've completed the tour. Click Finish to close."
          placement="top"
        />
        <DemoContent />
      </Tour>
    </HintsProvider>
  )
}

export default App
