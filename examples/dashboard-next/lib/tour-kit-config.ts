import type { Feature } from '@tour-kit/adoption'
import type { AnnouncementConfig } from '@tour-kit/announcements'
import type { ChecklistConfig } from '@tour-kit/checklists'
import type { SurveyConfig } from '@tour-kit/surveys'

export const demoUser = {
  id: 'demo-user',
  plan: 'pro' as const,
  createdAt: '2026-01-15',
}

export const announcements: AnnouncementConfig[] = [
  {
    id: 'welcome',
    variant: 'modal',
    priority: 'high',
    title: 'Welcome to Helm',
    description:
      'Helm is your B2B project-analytics workspace. Watch the 2-minute tour or jump straight in.',
    media: {
      type: 'auto',
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      alt: 'Helm 2-minute walkthrough',
    },
    modalOptions: { size: 'md' },
    autoShow: false,
  },
  {
    // Director cue 2 — the product-update banner that slides down before the modal.
    id: 'product-update',
    variant: 'banner',
    priority: 'high',
    title: 'New in Helm — Cohort retention is live 🎉',
    description: 'Slice activation and retention by signup cohort, plan, and channel.',
    autoShow: false,
    bannerOptions: { position: 'top', dismissable: true, intent: 'success' },
  },
  {
    // Director cue 6 — scheduling. Genuinely auto-shown only during business
    // hours by <ScheduledBanner>; the Director force-shows it for the reel.
    id: 'business-hours',
    variant: 'banner',
    priority: 'normal',
    title: 'Timed to your business hours',
    description: 'This tip is scheduled to appear Mon–Fri, 9–5 in your timezone via @tour-kit/scheduling.',
    autoShow: false,
    bannerOptions: { position: 'top', dismissable: true, intent: 'info' },
  },
  {
    id: 'maintenance',
    variant: 'banner',
    priority: 'normal',
    title: 'Scheduled maintenance Sunday 2 AM UTC',
    description: 'Expect ~15 minutes of downtime while we upgrade the analytics engine.',
    audience: [{ type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' }],
    autoShow: false,
  },
  {
    id: 'ai-live',
    variant: 'toast',
    priority: 'low',
    title: 'AI assistant is live in Help',
    description: 'Ask "how do I invite a teammate?" — it knows every surface in Helm.',
    toastOptions: { position: 'top-right', autoDismiss: true, autoDismissDelay: 8000 },
    autoShow: false,
  },
  {
    id: 'whats-new',
    variant: 'slideout',
    priority: 'normal',
    title: "What's new in Helm",
    description:
      'A scrollable side panel for changelogs, release notes, and longer announcements.',
    autoShow: false,
    slideoutOptions: { position: 'right', size: 'md' },
  },
  {
    id: 'profile-feature',
    variant: 'spotlight',
    priority: 'normal',
    title: 'New: profile menu',
    description: 'Manage themes, billing, and sign-out from here.',
    autoShow: false,
    spotlightOptions: { targetSelector: '#user-menu', placement: 'bottom', offset: 12 },
  },
]

export const checklists: ChecklistConfig[] = [
  {
    id: 'get-started',
    title: 'Get started with Helm',
    description: 'Four things to try while you’re here.',
    tasks: [
      {
        id: 'create-project',
        title: 'Create your first project',
        description: 'Click "New project" on the dashboard.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard' },
      },
      {
        id: 'invite-teammate',
        title: 'Invite a teammate',
        description: 'Share Helm with someone on your team.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard/team' },
      },
      {
        id: 'view-analytics',
        title: 'Open your analytics',
        description: 'See MRR, activation, and retention.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard/analytics' },
      },
      {
        id: 'connect-slack',
        title: 'Connect Slack',
        description: 'Pipe activity into your team channel.',
        manualComplete: true,
        dependsOn: ['create-project'],
        action: { type: 'navigate', url: '/dashboard/settings' },
      },
    ],
  },
]

export const trackedFeatures: Feature[] = [
  {
    id: 'dark-mode',
    name: 'Dark mode',
    trigger: '#dark-mode-toggle',
    category: 'customization',
    description: 'Flip the UI between light and dark.',
  },
  {
    id: 'keyboard-shortcuts',
    name: 'Keyboard shortcuts',
    trigger: { event: 'shortcuts:opened' },
    category: 'productivity',
    description: 'Press ⌘K to open the command palette and move faster.',
    priority: 10,
  },
  {
    id: 'export-csv',
    name: 'Export CSV',
    trigger: '#export-btn',
    adoptionCriteria: { minUses: 1 },
    category: 'data',
    description: 'Download your analytics as CSV.',
  },
]

export const surveys: SurveyConfig[] = [
  {
    id: 'onboarding-csat',
    type: 'csat',
    displayMode: 'modal',
    priority: 'normal',
    title: 'How was the walkthrough?',
    description: 'One tap helps us iterate on the onboarding.',
    questions: [
      {
        id: 'q1',
        type: 'rating',
        text: 'How would you rate the walkthrough?',
        ratingScale: { min: 1, max: 5 },
        required: true,
      },
    ],
    frequency: { type: 'interval', days: 90 },
  },
  {
    // Director cue 4 — NPS that slides in from the corner (right slideout).
    id: 'nps-pulse',
    type: 'nps',
    displayMode: 'slideout',
    priority: 'normal',
    title: 'Quick question',
    description: 'How likely are you to recommend Helm to a colleague?',
    questions: [
      {
        id: 'nps',
        type: 'rating',
        text: 'How likely are you to recommend Helm?',
        ratingScale: { min: 0, max: 10 },
        required: true,
      },
    ],
    slideoutOptions: { position: 'right', size: 'sm' },
    frequency: 'always',
  },
]
