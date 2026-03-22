'use client'

import { AiChatProvider, AiChatSuggestions, useTourAssistant } from '@tour-kit/ai'

const tourConfig = {
  tours: [
    {
      id: 'demo',
      name: 'Demo Tour',
      steps: [
        { id: 'step-1', title: 'Welcome', content: 'Welcome to the demo.' },
        { id: 'step-2', title: 'Features', content: 'Explore our features.' },
      ],
    },
  ],
}

function ChatContent() {
  const { tourContext, askAboutStep, askForHelp, suggestions, messages } = useTourAssistant()

  return (
    <div style={{ padding: '2rem' }}>
      <h1>AI Chat with Tour Integration</h1>
      {tourContext.activeTour && (
        <div>
          <p>
            Current tour: {tourContext.activeTour.name} (step{' '}
            {tourContext.activeTour.currentStep + 1}/{tourContext.activeTour.totalSteps})
          </p>
          <button type="button" onClick={askAboutStep}>
            Ask about this step
          </button>
          <button type="button" onClick={() => askForHelp('navigation')}>
            Help with navigation
          </button>
        </div>
      )}
      <div>
        <h2>Messages ({messages.length})</h2>
        <AiChatSuggestions
          suggestions={suggestions.length > 0 ? suggestions : ['How do I get started?']}
        />
      </div>
    </div>
  )
}

export default function AiChatPage() {
  return (
    <AiChatProvider
      config={{
        endpoint: '/api/chat',
        tourContext: true,
        suggestions: {
          static: ['How do I get started?', 'What features are available?'],
          dynamic: true,
        },
        persistence: 'local',
      }}
    >
      <ChatContent />
    </AiChatProvider>
  )
}
