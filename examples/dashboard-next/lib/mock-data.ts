export type ProjectStatus = 'active' | 'paused' | 'archived'
export type Role = 'admin' | 'editor' | 'viewer'
export type KanbanColumn = 'todo' | 'in-progress' | 'done'

export type Project = {
  id: string
  name: string
  status: ProjectStatus
  owner: string
  ownerAvatar: string
  updatedAt: string
  description: string
}

export type TeamMember = {
  id: string
  name: string
  email: string
  role: Role
  avatar: string
  department: string
}

export type KanbanCard = {
  id: string
  title: string
  column: KanbanColumn
  assignee: string
  labels: string[]
}

export type ActivityItem = {
  id: string
  actor: string
  action: string
  target: string
  timestamp: string
}

export const projects: Project[] = [
  {
    id: 'proj-atlas',
    name: 'Atlas rebrand',
    status: 'active',
    owner: 'Priya Kapoor',
    ownerAvatar: 'PK',
    updatedAt: '2026-04-20T10:15:00Z',
    description: 'Refresh of the product marketing site ahead of the Series B announcement.',
  },
  {
    id: 'proj-compass',
    name: 'Compass onboarding',
    status: 'active',
    owner: 'Jordan Reyes',
    ownerAvatar: 'JR',
    updatedAt: '2026-04-21T14:03:00Z',
    description: 'New self-serve onboarding flow with guided checklist and sample data.',
  },
  {
    id: 'proj-vector',
    name: 'Vector analytics v2',
    status: 'paused',
    owner: 'Sam Lin',
    ownerAvatar: 'SL',
    updatedAt: '2026-04-10T09:30:00Z',
    description: 'Second iteration of the analytics dashboard with cohort views.',
  },
  {
    id: 'proj-horizon',
    name: 'Horizon mobile',
    status: 'active',
    owner: 'Mia Okafor',
    ownerAvatar: 'MO',
    updatedAt: '2026-04-22T07:45:00Z',
    description: 'Native mobile client — read-only kanban for the first milestone.',
  },
  {
    id: 'proj-delta',
    name: 'Delta migrations',
    status: 'archived',
    owner: 'Henry Choi',
    ownerAvatar: 'HC',
    updatedAt: '2026-03-15T16:20:00Z',
    description: 'Legacy database migration — shipped Q1.',
  },
  {
    id: 'proj-summit',
    name: 'Summit integrations',
    status: 'active',
    owner: 'Ada Fields',
    ownerAvatar: 'AF',
    updatedAt: '2026-04-22T11:00:00Z',
    description: 'Slack, Linear, and GitHub integrations for project notifications.',
  },
]

export const teamMembers: TeamMember[] = [
  {
    id: 'u-1',
    name: 'Priya Kapoor',
    email: 'priya@stacks.app',
    role: 'admin',
    avatar: 'PK',
    department: 'Design',
  },
  {
    id: 'u-2',
    name: 'Jordan Reyes',
    email: 'jordan@stacks.app',
    role: 'admin',
    avatar: 'JR',
    department: 'Engineering',
  },
  {
    id: 'u-3',
    name: 'Sam Lin',
    email: 'sam@stacks.app',
    role: 'editor',
    avatar: 'SL',
    department: 'Data',
  },
  {
    id: 'u-4',
    name: 'Mia Okafor',
    email: 'mia@stacks.app',
    role: 'editor',
    avatar: 'MO',
    department: 'Mobile',
  },
  {
    id: 'u-5',
    name: 'Henry Choi',
    email: 'henry@stacks.app',
    role: 'viewer',
    avatar: 'HC',
    department: 'Operations',
  },
  {
    id: 'u-6',
    name: 'Ada Fields',
    email: 'ada@stacks.app',
    role: 'editor',
    avatar: 'AF',
    department: 'Engineering',
  },
  {
    id: 'u-7',
    name: 'Luca Rossi',
    email: 'luca@stacks.app',
    role: 'viewer',
    avatar: 'LR',
    department: 'Marketing',
  },
  {
    id: 'u-8',
    name: 'Nia Patel',
    email: 'nia@stacks.app',
    role: 'editor',
    avatar: 'NP',
    department: 'Design',
  },
]

export const kanbanCards: KanbanCard[] = [
  {
    id: 'k-1',
    title: 'Audit current typography system',
    column: 'todo',
    assignee: 'PK',
    labels: ['design'],
  },
  {
    id: 'k-2',
    title: 'Draft new color palette',
    column: 'todo',
    assignee: 'PK',
    labels: ['design'],
  },
  {
    id: 'k-3',
    title: 'Migrate icons to lucide',
    column: 'in-progress',
    assignee: 'NP',
    labels: ['design', 'frontend'],
  },
  {
    id: 'k-4',
    title: 'Wire up navigation analytics',
    column: 'in-progress',
    assignee: 'JR',
    labels: ['frontend'],
  },
  {
    id: 'k-5',
    title: 'Write release notes v4.1',
    column: 'in-progress',
    assignee: 'AF',
    labels: ['docs'],
  },
  {
    id: 'k-6',
    title: 'Ship dark mode toggle',
    column: 'done',
    assignee: 'JR',
    labels: ['frontend'],
  },
  {
    id: 'k-7',
    title: 'Add keyboard shortcut hints',
    column: 'done',
    assignee: 'AF',
    labels: ['frontend'],
  },
  {
    id: 'k-8',
    title: 'Accessibility audit pass',
    column: 'done',
    assignee: 'NP',
    labels: ['a11y'],
  },
]

export const activityFeed: ActivityItem[] = [
  {
    id: 'a-1',
    actor: 'Priya Kapoor',
    action: 'updated',
    target: 'Atlas rebrand',
    timestamp: '2 min ago',
  },
  {
    id: 'a-2',
    actor: 'Jordan Reyes',
    action: 'commented on',
    target: 'Compass onboarding',
    timestamp: '18 min ago',
  },
  {
    id: 'a-3',
    actor: 'Ada Fields',
    action: 'moved card to Done in',
    target: 'Summit integrations',
    timestamp: '42 min ago',
  },
  {
    id: 'a-4',
    actor: 'Mia Okafor',
    action: 'invited a teammate to',
    target: 'Horizon mobile',
    timestamp: '1 hour ago',
  },
  {
    id: 'a-5',
    actor: 'Sam Lin',
    action: 'paused',
    target: 'Vector analytics v2',
    timestamp: '3 hours ago',
  },
]

export const faqEntries = [
  {
    q: 'How do I invite a teammate?',
    a: 'Open the Team page and click "Invite". Share the link with your teammate — they sign up with their work email.',
  },
  {
    q: 'Can I export my kanban board?',
    a: 'Yes. Open any project and click Export to download a CSV snapshot of every card.',
  },
  {
    q: 'Where do I change my notification preferences?',
    a: 'Settings → Notifications. You can pick email, Slack, or in-app for each event type.',
  },
  {
    q: 'How does billing work?',
    a: 'Monthly or annual billing via Polar. Upgrade under Settings → Billing.',
  },
  {
    q: 'What keyboard shortcuts exist?',
    a: 'Press ⌘K anywhere to open the command palette and see the full list.',
  },
]

export const stats = [
  { label: 'Active projects', value: 4, delta: '+1 this week' },
  { label: 'Open tasks', value: 32, delta: '-5 since Monday' },
  { label: 'Teammates online', value: 6, delta: 'of 8' },
  { label: 'Completed this week', value: 18, delta: '+42% vs last week' },
]
