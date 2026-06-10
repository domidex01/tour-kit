export function AiChatPage() {
  return (
    <div className="min-h-[calc(100vh-60px)] bg-background">
      <div className="max-w-4xl mx-auto p-8 space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">AI Chat</h1>
          <p className="text-muted-foreground mt-2">
            The AI assistant is available on every page — click the chat button in the bottom-left
            corner.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border bg-popover p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Always Available</h2>
            <p className="text-sm text-muted-foreground">
              The chat widget is global — it stays open as you navigate between pages, keeping your
              conversation context.
            </p>
          </div>

          <div className="rounded-lg border bg-popover p-6 shadow-sm space-y-3">
            <h2 className="text-lg font-semibold">Try It Out</h2>
            <p className="text-sm text-muted-foreground">
              Open the chat and ask a question. Suggestions appear as clickable chips. Navigate to
              another page and the chat persists.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AiChatPage
