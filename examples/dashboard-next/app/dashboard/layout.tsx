import { DashboardSidebar } from '@/components/dashboard/sidebar'
import { DashboardTopbar } from '@/components/dashboard/topbar'
import { AnnouncementsHost } from '@/components/tour-kit/announcements-host'
import { ChecklistDock } from '@/components/tour-kit/checklist-dock'
import { CsatSurveyHost } from '@/components/tour-kit/csat-survey-host'
import { DarkModeHint } from '@/components/tour-kit/hints'
import { OnboardingTour } from '@/components/tour-kit/onboarding-tour'
import type { ReactNode } from 'react'

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-svh">
      <DashboardSidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <DashboardTopbar />
        <main className="flex-1 overflow-y-auto bg-muted/30">{children}</main>
      </div>

      <AnnouncementsHost />
      <OnboardingTour />
      <ChecklistDock />
      <DarkModeHint />
      <CsatSurveyHost />
    </div>
  )
}
