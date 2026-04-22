import type { AnnouncementConfig } from '@tour-kit/announcements'
import type { ChecklistConfig } from '@tour-kit/checklists'
import type { Feature } from '@tour-kit/adoption'
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
    title: 'Welcome to Stacks beta',
    description:
      'Stacks is a demo workspace built to exercise every @tour-kit/* package in one place. Watch the walkthrough or skip to explore.',
    media: {
      type: 'video',
      src: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      alt: 'Stacks 2-minute walkthrough',
    },
    frequency: 'once',
    modalOptions: { size: 'md' },
  },
  {
    id: 'maintenance',
    variant: 'banner',
    priority: 'normal',
    title: 'Scheduled maintenance Sunday 2 AM UTC',
    description: 'Expect ~15 minutes of downtime while we upgrade the kanban engine.',
    audience: [
      { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
    ],
    // ScheduledBanner decides when to show this — only during business hours.
    autoShow: false,
  },
  {
    id: 'ai-live',
    variant: 'toast',
    priority: 'low',
    title: 'AI assistant is live in Help',
    description: 'Ask "how do I export?" — it knows every surface in this demo.',
    frequency: 'once',
    toastOptions: { position: 'top-right', autoDismiss: true, autoDismissDelay: 8000 },
  },
]

export const checklists: ChecklistConfig[] = [
  {
    id: 'get-started',
    title: 'Get started with Stacks',
    description: 'Four things to try while you’re here.',
    tasks: [
      {
        id: 'create-project',
        title: 'Create your first project',
        description: 'Click "New project" on the overview.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard' },
      },
      {
        id: 'invite-teammate',
        title: 'Invite a teammate',
        description: 'Share Stacks with someone on your team.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard/team' },
      },
      {
        id: 'move-card',
        title: 'Move a kanban card',
        description: 'Drag a card between columns in any project.',
        manualComplete: true,
        action: { type: 'navigate', url: '/dashboard/projects/proj-atlas' },
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
    description: 'Open the shortcut cheatsheet.',
  },
  {
    id: 'export-csv',
    name: 'Export CSV',
    trigger: '#export-btn',
    category: 'data',
    description: 'Download kanban cards as CSV.',
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
]
