export default function AiChatPage() {
  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat Demo</h1>
          <p className="text-muted-foreground mt-2">
            The AI assistant is available on every page — click the chat button
            in the bottom-left corner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-popover p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Features</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Floating chat widget with polished UI</li>
              <li>Context-aware responses via CAG</li>
              <li>Smart follow-up suggestions</li>
              <li>Tour integration for step-aware help</li>
            </ul>
          </div>

          <div className="rounded-lg border bg-popover p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">How It Works</h2>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li>Documents are stuffed into the system prompt</li>
              <li>The AI model answers based on your product docs</li>
              <li>Tour context is injected when a tour is active</li>
              <li>Suggestions refresh after each response</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
