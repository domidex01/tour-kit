import { AiChatProvider, AiChatSuggestions } from '@tour-kit/ai'

export function AiChatPage() {
  return (
    <AiChatProvider
      config={{
        endpoint: '/api/chat',
        suggestions: {
          static: ['What plans are available?', 'How do I export data?', 'How do teams work?'],
        },
      }}
    >
      <div style={{ padding: '2rem' }}>
        <h1>AI Help Chat (Standalone)</h1>
        <p>Ask questions about our product using the suggestions below.</p>
        <AiChatSuggestions />
      </div>
    </AiChatProvider>
  )
}

export default AiChatPage
