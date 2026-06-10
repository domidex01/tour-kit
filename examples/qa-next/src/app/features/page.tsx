'use client'

export default function FeaturesPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header id="features-header" className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-4">Features</h1>
          <p className="text-muted-foreground">
            Everything you need to create amazing product tours
          </p>
        </header>

        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div id="feature-multipage" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Multi-Page Tours</h2>
            <p className="text-muted-foreground">
              Create tours that span multiple pages and routes. Tours automatically navigate users
              to the correct page for each step.
            </p>
          </div>

          <div id="feature-persistence" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">State Persistence</h2>
            <p className="text-muted-foreground">
              Tour progress is saved across page refreshes and browser sessions. Users can pick up
              where they left off.
            </p>
          </div>

          <div id="feature-headless" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Headless Architecture</h2>
            <p className="text-muted-foreground">
              Fully customizable components. Use your own UI or the built-in styled components.
            </p>
          </div>

          <div id="feature-accessibility" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Accessibility First</h2>
            <p className="text-muted-foreground">
              Built with WCAG 2.1 AA compliance. Keyboard navigation, focus management, and screen
              reader support.
            </p>
          </div>

          <div id="feature-frameworks" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">Framework Support</h2>
            <p className="text-muted-foreground">
              Works with Next.js (App & Pages Router), React Router, and any React application.
            </p>
          </div>

          <div id="feature-typescript" className="p-6 rounded-lg border bg-popover shadow-sm">
            <h2 className="text-xl font-semibold mb-2">TypeScript Native</h2>
            <p className="text-muted-foreground">
              Full TypeScript support with comprehensive type definitions for all APIs.
            </p>
          </div>
        </section>
      </div>
    </div>
  )
}
