'use client'

import type { ReactNode } from 'react'
import { AdoptionProvider } from '@tour-kit/adoption'
import { AiChatProvider } from '@tour-kit/ai'
import { AnalyticsProvider, consolePlugin } from '@tour-kit/analytics'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'
import { HintsProvider } from '@tour-kit/hints'
import { LicenseProvider } from '@tour-kit/license'
import { SurveysProvider } from '@tour-kit/surveys'
import {
  announcements,
  checklists,
  demoUser,
  surveys,
  trackedFeatures,
} from '@/lib/tour-kit-config'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LicenseProvider organizationId="smoke-org" licenseKey="">
      <AnalyticsProvider
        config={{
          plugins: [consolePlugin({ collapsed: true, prefix: '[smoke]' })],
          debug: false,
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
                  <AiChatProvider config={{ endpoint: '/api/chat', tourContext: false }}>
                    {children}
                  </AiChatProvider>
                </SurveysProvider>
              </AdoptionProvider>
            </ChecklistProvider>
          </AnnouncementsProvider>
        </HintsProvider>
      </AnalyticsProvider>
    </LicenseProvider>
  )
}
