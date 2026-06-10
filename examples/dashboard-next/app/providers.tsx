'use client'

import { DirectorProvider } from '@/components/tour-kit/director-context'
import { Toaster } from '@/components/ui/sonner'
import { eventBufferPlugin } from '@/lib/event-buffer'
import {
  announcements,
  checklists,
  demoUser,
  surveys,
  trackedFeatures,
} from '@/lib/tour-kit-config'
import { AdoptionProvider } from '@tour-kit/adoption'
import { AiChatProvider } from '@tour-kit/ai'
import { AnalyticsProvider, type AnalyticsPlugin, consolePlugin } from '@tour-kit/analytics'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'
import { HintsProvider } from '@tour-kit/hints'
import { LicenseProvider } from '@tour-kit/license'
import { SurveysProvider } from '@tour-kit/surveys'
import { type ReactNode, useState } from 'react'

// Console analytics output is dev chrome — only attach it when Director mode
// was last enabled (the `~` toggle). The silent event-buffer plugin is always
// on so the "Measure" readout has a live feed without polluting the console.
function useAnalyticsPlugins(): AnalyticsPlugin[] {
  const [plugins] = useState<AnalyticsPlugin[]>(() => {
    const directorOn =
      typeof window !== 'undefined' && window.localStorage.getItem('helm-director') === '1'
    return directorOn
      ? [eventBufferPlugin(), consolePlugin({ collapsed: false, prefix: '[helm]' })]
      : [eventBufferPlugin()]
  })
  return plugins
}

export function Providers({ children }: { children: ReactNode }) {
  const plugins = useAnalyticsPlugins()

  return (
    <>
      <LicenseProvider
        organizationId={process.env.NEXT_PUBLIC_POLAR_ORG_ID ?? ''}
        licenseKey={process.env.NEXT_PUBLIC_TOUR_KIT_LICENSE_KEY ?? ''}
      >
        <AnalyticsProvider config={{ plugins }}>
          <HintsProvider>
            <AnnouncementsProvider
              announcements={announcements}
              userContext={demoUser as unknown as Record<string, unknown>}
            >
              <ChecklistProvider
                checklists={checklists}
                context={demoUser as unknown as Record<string, unknown>}
              >
                <AdoptionProvider
                  features={trackedFeatures}
                  userId={demoUser.id}
                  nudge={{ enabled: true, cooldown: 0, maxPerSession: 99 }}
                >
                  <SurveysProvider
                    surveys={surveys}
                    userContext={demoUser as unknown as Record<string, unknown>}
                  >
                    <AiChatProvider config={{ endpoint: '/api/chat', tourContext: true }}>
                      <DirectorProvider>{children}</DirectorProvider>
                    </AiChatProvider>
                  </SurveysProvider>
                </AdoptionProvider>
              </ChecklistProvider>
            </AnnouncementsProvider>
          </HintsProvider>
        </AnalyticsProvider>
      </LicenseProvider>
      <Toaster position="top-right" />
    </>
  )
}
