'use client'

import type { ReactNode } from 'react'
import { LicenseProvider } from '@tour-kit/license'
import { AnalyticsProvider, consolePlugin } from '@tour-kit/analytics'
import { HintsProvider } from '@tour-kit/hints'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'
import { AdoptionProvider } from '@tour-kit/adoption'
import { SurveysProvider } from '@tour-kit/surveys'
import { AiChatProvider } from '@tour-kit/ai'
import {
  announcements,
  checklists,
  demoUser,
  surveys,
  trackedFeatures,
} from '@/lib/tour-kit-config'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LicenseProvider
      organizationId={process.env.NEXT_PUBLIC_POLAR_ORGANIZATION_ID ?? ''}
      licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}
    >
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
                  <SurveysProvider surveys={surveys} userContext={demoUser as unknown as Record<string, unknown>}>
                    <AiChatProvider
                      config={{ endpoint: '/api/chat', tourContext: true }}
                    >
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
