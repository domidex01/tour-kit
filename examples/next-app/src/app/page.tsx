'use client'

import { Tour, TourStep, useTour } from '@tour-kit/react'

function DemoContent() {
  const { start } = useTour('demo-tour')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 id="title" className="text-3xl font-bold text-foreground">
            TourKit Next.js Demo
          </h1>
          <button
            onClick={() => start()}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
          >
            Start Tour
          </button>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            id="feature-1"
            className="p-6 rounded-lg border bg-popover shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">Server Components</h2>
            <p className="text-muted-foreground">
              Next.js 15 with React Server Components support.
            </p>
          </div>

          <div
            id="feature-2"
            className="p-6 rounded-lg border bg-popover shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">App Router</h2>
            <p className="text-muted-foreground">
              Built for the new Next.js App Router architecture.
            </p>
          </div>

          <div
            id="feature-3"
            className="p-6 rounded-lg border bg-popover shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-2">Headless UI</h2>
            <p className="text-muted-foreground">
              Fully customizable with Tailwind CSS styling.
            </p>
          </div>
        </section>

        <section id="cta" className="p-8 rounded-lg bg-secondary text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to get started?</h2>
          <p className="text-muted-foreground mb-4">
            Click the button above to take a tour of our features.
          </p>
        </section>
      </div>
    </div>
  )
}

export default function Home() {
  return (
    <Tour
      id="demo-tour"
      onComplete={() => console.log('Tour completed!')}
      onSkip={() => console.log('Tour skipped!')}
    >
      <TourStep
        id="welcome"
        target="#title"
        title="Welcome to TourKit!"
        content="This is a demo running in Next.js 15 with the App Router."
        placement="bottom"
      />
      <TourStep
        id="feature-1"
        target="#feature-1"
        title="Server Components"
        content="TourKit works great with Next.js Server Components."
        placement="bottom"
      />
      <TourStep
        id="feature-2"
        target="#feature-2"
        title="App Router"
        content="Built for the modern Next.js architecture."
        placement="bottom"
      />
      <TourStep
        id="feature-3"
        target="#feature-3"
        title="Headless UI"
        content="Customize every aspect with your own styles."
        placement="bottom"
      />
      <TourStep
        id="cta"
        target="#cta"
        title="Get Started"
        content="That's it! You've completed the tour."
        placement="top"
      />
      <DemoContent />
    </Tour>
  )
}
