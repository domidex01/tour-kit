import { useBranch, useTour } from '@tour-kit/react'

export function BranchingPage() {
  const { start, isActive, currentStepIndex, totalSteps, stop } = useTour('branching-demo')

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header className="flex items-center justify-between">
          <h1 id="branching-title" className="text-3xl font-bold text-foreground">
            Dynamic Branching Demo
          </h1>
          <div className="flex items-center gap-4">
            {isActive && (
              <span className="text-sm text-muted-foreground">
                Step {currentStepIndex + 1} of {totalSteps}
              </span>
            )}
            {isActive && (
              <button
                type="button"
                onClick={() => stop()}
                className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/90 transition-colors"
              >
                Stop Tour
              </button>
            )}
            <button
              type="button"
              onClick={() => start()}
              disabled={isActive}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {isActive ? 'Tour in Progress...' : 'Start Branching Tour'}
            </button>
          </div>
        </header>

        <section className="p-8 rounded-lg bg-secondary">
          <h2 className="text-2xl font-bold mb-4">Personalized Tour Paths</h2>
          <p className="text-muted-foreground mb-4">
            This demo showcases TourKit's branching feature, which allows tours to adapt
            based on user choices. Select your role to see different tour paths!
          </p>
        </section>

        {/* Role Selection Section */}
        <section id="role-select" className="p-8 rounded-lg border bg-popover shadow-sm">
          <h2 className="text-xl font-semibold mb-4">Choose Your Role</h2>
          <p className="text-muted-foreground mb-6">
            Click one of the buttons below to select your role. The tour will show you
            content relevant to your selection.
          </p>
          <RoleButtons />
        </section>

        {/* Role-specific sections */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <section id="developer-section" className="p-6 rounded-lg border bg-popover shadow-sm">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Developer Track</h3>
            <p className="text-muted-foreground">
              Deep dive into our API documentation, code examples, and integration guides.
              Perfect for technical users who want to build custom solutions.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• API reference documentation</li>
              <li>• Code snippets & examples</li>
              <li>• SDK installation guides</li>
              <li>• Webhook integrations</li>
            </ul>
          </section>

          <section id="designer-section" className="p-6 rounded-lg border bg-popover shadow-sm">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-purple-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Designer Track</h3>
            <p className="text-muted-foreground">
              Explore our visual tools, theming options, and component library.
              Create beautiful onboarding experiences without code.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Theme customization</li>
              <li>• Component variants</li>
              <li>• Animation presets</li>
              <li>• Style templates</li>
            </ul>
          </section>

          <section id="manager-section" className="p-6 rounded-lg border bg-popover shadow-sm">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
              <svg
                className="w-6 h-6 text-green-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-lg font-semibold mb-2">Manager Track</h3>
            <p className="text-muted-foreground">
              Learn about team collaboration, analytics dashboards, and reporting features.
              Get insights into your team's onboarding performance.
            </p>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>• Team management</li>
              <li>• Analytics & reporting</li>
              <li>• Performance metrics</li>
              <li>• Collaboration tools</li>
            </ul>
          </section>
        </div>

        <section className="p-6 rounded-lg border bg-muted/50">
          <h2 className="text-lg font-semibold mb-2">How Branching Works</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <strong>onAction:</strong> Define named actions on steps with target destinations
            </li>
            <li>
              <strong>useBranch:</strong> Hook that provides triggerAction, hasAction, and
              availableActions
            </li>
            <li>
              <strong>Dynamic paths:</strong> Navigate to different steps based on user input
            </li>
            <li>
              <strong>Converging flows:</strong> Multiple paths can merge back to a common endpoint
            </li>
          </ul>
        </section>
      </div>
    </div>
  )
}

function RoleButtons() {
  const { triggerAction, hasAction } = useBranch()
  const { isActive, currentStep } = useTour('branching-demo')

  // Only show buttons when the tour is active and on the role-select step
  const showButtons = isActive && currentStep?.id === 'role-select'

  if (!showButtons) {
    return (
      <div className="flex gap-4">
        <button
          type="button"
          disabled
          className="px-6 py-3 bg-blue-100 text-blue-800 rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Developer
        </button>
        <button
          type="button"
          disabled
          className="px-6 py-3 bg-purple-100 text-purple-800 rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Designer
        </button>
        <button
          type="button"
          disabled
          className="px-6 py-3 bg-green-100 text-green-800 rounded-lg font-medium opacity-50 cursor-not-allowed"
        >
          Manager
        </button>
      </div>
    )
  }

  const buttonConfig = [
    {
      action: 'developer',
      label: 'Developer',
      bgClass: 'bg-blue-100 hover:bg-blue-200',
      textClass: 'text-blue-800',
    },
    {
      action: 'designer',
      label: 'Designer',
      bgClass: 'bg-purple-100 hover:bg-purple-200',
      textClass: 'text-purple-800',
    },
    {
      action: 'manager',
      label: 'Manager',
      bgClass: 'bg-green-100 hover:bg-green-200',
      textClass: 'text-green-800',
    },
  ]

  return (
    <div className="flex gap-4">
      {buttonConfig.map(({ action, label, bgClass, textClass }) => (
        <button
          key={action}
          type="button"
          onClick={() => triggerAction(action)}
          disabled={!hasAction(action)}
          className={`px-6 py-3 ${bgClass} ${textClass} rounded-lg font-medium transition-colors disabled:opacity-50`}
        >
          {label}
        </button>
      ))}
    </div>
  )
}
