'use client'

import { Toaster } from '@/components/ui/sonner'
import {
  announcements,
  checklists,
  demoUser,
  surveys,
  trackedFeatures,
} from '@/lib/tour-kit-config'
import { AdoptionProvider } from '@tour-kit/adoption'
import { AiChatProvider } from '@tour-kit/ai'
import { AnalyticsProvider, consolePlugin } from '@tour-kit/analytics'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'
import { HintsProvider } from '@tour-kit/hints'
import { SurveysProvider } from '@tour-kit/surveys'
import type { ReactNode } from 'react'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <>
      <AnalyticsProvider
        config={{
          plugins: [consolePlugin({ collapsed: false, prefix: '[tour-kit]' })],
          debug: true,
        }}
      >
        <HintsProvider>
          <AnnouncementsProvider
            announcements={announcements}
            userContext={demoUser as unknown as Record<string, unknown>}
          >
            <ChecklistProvider
              checklists={checklists}
              context={demoUser as unknown as Record<string, unknown>}
            >
              <AdoptionProvider features={trackedFeatures} userId={demoUser.id}>
                <SurveysProvider
                  surveys={surveys}
                  userContext={demoUser as unknown as Record<string, unknown>}
                >
                  <AiChatProvider config={{ endpoint: '/api/chat', tourContext: true }}>
                    {children}
                  </AiChatProvider>
                </SurveysProvider>
              </AdoptionProvider>
            </ChecklistProvider>
          </AnnouncementsProvider>
        </HintsProvider>
      </AnalyticsProvider>
      <Toaster position="top-right" />
    </>
  )
}
