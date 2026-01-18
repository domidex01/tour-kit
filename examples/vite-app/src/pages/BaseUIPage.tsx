import {
  type RenderProp,
  TourClose,
  type UILibrary,
  UILibraryProvider,
  useUILibrary,
} from '@tour-kit/react'
import { useState } from 'react'

// Demo component that shows current UI library mode
function UILibraryBadge() {
  const library = useUILibrary()
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        library === 'base-ui' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
      }`}
    >
      {library === 'base-ui' ? 'Base UI Mode' : 'Radix UI Mode'}
    </span>
  )
}

// Custom button component for demonstrating asChild
function CustomButton({
  children,
  variant = 'primary',
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'destructive'
}) {
  const variantClasses = {
    primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
    secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/90',
    destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
  }

  return (
    <button
      type="button"
      className={`px-4 py-2 rounded-md transition-colors font-medium ${variantClasses[variant]}`}
      {...props}
    >
      {children}
    </button>
  )
}

// Demo section for TourClose with Radix UI style
function RadixUIDemo() {
  const [closeCount, setCloseCount] = useState(0)

  return (
    <div className="p-6 rounded-lg border bg-popover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Radix UI Style (Default)</h3>
        <UILibraryBadge />
      </div>
      <p className="text-muted-foreground mb-4">
        Uses element composition - the child element is cloned with merged props.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Code Pattern:</h4>
          <pre className="text-sm bg-background p-2 rounded overflow-x-auto">
            {`<TourClose asChild>
  <CustomButton>Close Tour</CustomButton>
</TourClose>`}
          </pre>
        </div>

        <div className="flex items-center gap-4">
          <TourClose asChild>
            <CustomButton variant="destructive" onClick={() => setCloseCount((c) => c + 1)}>
              Close Tour (Radix)
            </CustomButton>
          </TourClose>
          <span className="text-sm text-muted-foreground">Clicked: {closeCount} times</span>
        </div>
      </div>
    </div>
  )
}

// Demo section for TourClose with Base UI style
function BaseUIDemo() {
  const [closeCount, setCloseCount] = useState(0)

  const renderButton: RenderProp = (props) => (
    <CustomButton
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      variant="destructive"
      onClick={(e) => {
        setCloseCount((c) => c + 1)
        // Call original onClick if present
        const onClick = props.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined
        onClick?.(e)
      }}
    >
      Close Tour (Base UI)
    </CustomButton>
  )

  return (
    <UILibraryProvider library="base-ui">
      <div className="p-6 rounded-lg border bg-popover">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Base UI Style</h3>
          <UILibraryBadge />
        </div>
        <p className="text-muted-foreground mb-4">
          Uses render props - a function receives props to spread onto your element.
        </p>

        <div className="space-y-4">
          <div className="p-4 bg-muted rounded-md">
            <h4 className="font-medium mb-2">Code Pattern:</h4>
            <pre className="text-sm bg-background p-2 rounded overflow-x-auto">
              {`<TourClose asChild>
  {(props) => (
    <CustomButton {...props}>
      Close Tour
    </CustomButton>
  )}
</TourClose>`}
            </pre>
          </div>

          <div className="flex items-center gap-4">
            <TourClose asChild>{renderButton}</TourClose>
            <span className="text-sm text-muted-foreground">Clicked: {closeCount} times</span>
          </div>
        </div>
      </div>
    </UILibraryProvider>
  )
}

// Interactive toggle demo
function InteractiveDemo() {
  const [mode, setMode] = useState<UILibrary>('radix-ui')
  const [clickCount, setClickCount] = useState(0)

  const renderButton: RenderProp = (props) => (
    <button
      type="button"
      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
      {...(props as React.ButtonHTMLAttributes<HTMLButtonElement>)}
      onClick={(e) => {
        setClickCount((c) => c + 1)
        const onClick = props.onClick as React.MouseEventHandler<HTMLButtonElement> | undefined
        onClick?.(e)
      }}
    >
      Click Me ({mode})
    </button>
  )

  return (
    <div className="p-6 rounded-lg border bg-popover">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">Interactive Toggle Demo</h3>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setMode('radix-ui')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'radix-ui'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Radix UI
          </button>
          <button
            type="button"
            onClick={() => setMode('base-ui')}
            className={`px-3 py-1 rounded text-sm ${
              mode === 'base-ui'
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground'
            }`}
          >
            Base UI
          </button>
        </div>
      </div>

      <UILibraryProvider library={mode}>
        <div className="space-y-4">
          <UILibraryBadge />
          <p className="text-muted-foreground">
            Toggle between modes to see the same button work with both patterns.
          </p>

          <div className="flex items-center gap-4">
            <TourClose asChild>
              {mode === 'radix-ui' ? (
                <button
                  type="button"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 font-medium"
                  onClick={() => setClickCount((c) => c + 1)}
                >
                  Click Me ({mode})
                </button>
              ) : (
                renderButton
              )}
            </TourClose>
            <span className="text-sm text-muted-foreground">Clicked: {clickCount} times</span>
          </div>
        </div>
      </UILibraryProvider>
    </div>
  )
}

// Nested providers demo
function NestedProvidersDemo() {
  return (
    <div className="p-6 rounded-lg border bg-popover">
      <h3 className="text-lg font-semibold mb-4">Nested Providers</h3>
      <p className="text-muted-foreground mb-4">
        You can mix libraries in different parts of your app using nested providers.
      </p>

      <div className="space-y-4">
        <div className="p-4 bg-muted rounded-md">
          <h4 className="font-medium mb-2">Code Pattern:</h4>
          <pre className="text-sm bg-background p-2 rounded overflow-x-auto">
            {`<UILibraryProvider library="radix-ui">
  <Header />  {/* Uses Radix UI */}

  <UILibraryProvider library="base-ui">
    <MainContent />  {/* Uses Base UI */}
  </UILibraryProvider>

  <Footer />  {/* Uses Radix UI */}
</UILibraryProvider>`}
          </pre>
        </div>

        <UILibraryProvider library="radix-ui">
          <div className="grid grid-cols-3 gap-4">
            <div className="p-4 bg-purple-50 rounded-md">
              <UILibraryBadge />
              <p className="text-sm mt-2">Header section</p>
            </div>

            <UILibraryProvider library="base-ui">
              <div className="p-4 bg-blue-50 rounded-md">
                <UILibraryBadge />
                <p className="text-sm mt-2">Main content</p>
              </div>
            </UILibraryProvider>

            <div className="p-4 bg-purple-50 rounded-md">
              <UILibraryBadge />
              <p className="text-sm mt-2">Footer section</p>
            </div>
          </div>
        </UILibraryProvider>
      </div>
    </div>
  )
}

export function BaseUIPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <h1 id="baseui-header" className="text-3xl font-bold text-foreground mb-2">
            Base UI Support
          </h1>
          <p className="text-muted-foreground">
            TourKit supports both Radix UI (default) and Base UI for headless component primitives.
            This page demonstrates how to use each pattern.
          </p>
        </header>

        <section className="p-6 rounded-lg bg-secondary">
          <h2 className="text-xl font-bold mb-4">Why Base UI?</h2>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>
              <strong>MUI Integration:</strong> If you're using Material UI, Base UI provides a
              consistent component primitive pattern
            </li>
            <li>
              <strong>Render Props:</strong> Base UI uses render props which some developers prefer
              for explicit prop passing
            </li>
            <li>
              <strong>Flexibility:</strong> Choose the pattern that best fits your project's
              architecture
            </li>
          </ul>
        </section>

        <div className="grid gap-6">
          <RadixUIDemo />
          <BaseUIDemo />
          <InteractiveDemo />
          <NestedProvidersDemo />
        </div>

        <section className="p-6 rounded-lg bg-muted">
          <h2 className="text-xl font-bold mb-4">Getting Started</h2>
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">1. Install Base UI (optional)</h3>
              <pre className="text-sm bg-background p-2 rounded">pnpm add @mui/base</pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">2. Wrap your app with UILibraryProvider</h3>
              <pre className="text-sm bg-background p-2 rounded overflow-x-auto">
                {`import { UILibraryProvider } from '@tour-kit/react'

function App() {
  return (
    <UILibraryProvider library="base-ui">
      {/* Your app */}
    </UILibraryProvider>
  )
}`}
              </pre>
            </div>
            <div>
              <h3 className="font-medium mb-2">3. Use render props for asChild components</h3>
              <pre className="text-sm bg-background p-2 rounded overflow-x-auto">
                {`<TourClose asChild>
  {(props) => <MyButton {...props}>Close</MyButton>}
</TourClose>`}
              </pre>
            </div>
          </div>
        </section>

        <section className="p-6 rounded-lg bg-secondary">
          <h2 className="text-xl font-bold mb-4">Components with Base UI Support</h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h3 className="font-medium mb-2">@tour-kit/react</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>TourClose</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">@tour-kit/hints</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>HintHotspot</li>
                <li>HintTooltip</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">@tour-kit/adoption</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>AdoptionNudge</li>
                <li>FeatureButton</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">@tour-kit/checklists</h3>
              <ul className="text-sm text-muted-foreground list-disc list-inside">
                <li>Checklist</li>
                <li>ChecklistPanel</li>
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
