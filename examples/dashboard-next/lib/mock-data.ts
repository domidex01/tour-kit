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
  health: number
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

export type Kpi = {
  id: string
  label: string
  value: string
  delta: string
  trend: 'up' | 'down'
}

/**
 * Helm KPI strip — invented but plausible B2B project-analytics metrics.
 * Drives the dashboard overview cards. `id` doubles as a stable anchor
 * (`#kpi-<id>`) so tours and the Director media step can target a card.
 */
export const kpis: Kpi[] = [
  { id: 'mrr', label: 'MRR', value: '$48.2k', delta: '+6.4%', trend: 'up' },
  { id: 'active-users', label: 'Active users', value: '3,914', delta: '+312', trend: 'up' },
  { id: 'churn', label: 'Churn rate', value: '1.8%', delta: '-0.3pt', trend: 'up' },
  { id: 'nrr', label: 'Net revenue retention', value: '118%', delta: '+4pt', trend: 'up' },
  { id: 'activation', label: 'Activation rate', value: '64%', delta: '+9pt', trend: 'up' },
  { id: 'avg-session', label: 'Avg. session', value: '12m 40s', delta: '+1m 02s', trend: 'up' },
  { id: 'open-tickets', label: 'Open tickets', value: '23', delta: '-7', trend: 'up' },
  { id: 'projects-tracked', label: 'Projects tracked', value: '128', delta: '+11', trend: 'up' },
]

/**
 * 12 weeks of normalized series data (0–100) for the overview area chart.
 * Two stacked-ish series: active users vs. activation rate.
 */
export const chartSeries = {
  labels: ['W1', 'W2', 'W3', 'W4', 'W5', 'W6', 'W7', 'W8', 'W9', 'W10', 'W11', 'W12'],
  users: [38, 41, 44, 43, 49, 52, 55, 58, 57, 63, 68, 74],
  activation: [22, 26, 25, 31, 33, 38, 41, 44, 48, 52, 58, 64],
}

export const projects: Project[] = [
  {
    id: 'proj-atlas',
    name: 'Atlas rebrand',
    status: 'active',
    owner: 'Priya Kapoor',
    ownerAvatar: 'PK',
    updatedAt: '2026-06-08T10:15:00Z',
    description: 'Marketing-site refresh ahead of the Series B announcement.',
    health: 92,
  },
  {
    id: 'proj-compass',
    name: 'Compass onboarding',
    status: 'active',
    owner: 'Jordan Reyes',
    ownerAvatar: 'JR',
    updatedAt: '2026-06-09T14:03:00Z',
    description: 'Self-serve onboarding flow with guided checklist and sample data.',
    health: 88,
  },
  {
    id: 'proj-vector',
    name: 'Vector analytics v2',
    status: 'paused',
    owner: 'Sam Lin',
    ownerAvatar: 'SL',
    updatedAt: '2026-05-28T09:30:00Z',
    description: 'Second iteration of the analytics dashboard with cohort views.',
    health: 61,
  },
  {
    id: 'proj-horizon',
    name: 'Horizon mobile',
    status: 'active',
    owner: 'Mia Okafor',
    ownerAvatar: 'MO',
    updatedAt: '2026-06-09T07:45:00Z',
    description: 'Native mobile client — read-only analytics for the first milestone.',
    health: 79,
  },
  {
    id: 'proj-delta',
    name: 'Delta migrations',
    status: 'archived',
    owner: 'Henry Choi',
    ownerAvatar: 'HC',
    updatedAt: '2026-03-15T16:20:00Z',
    description: 'Legacy database migration — shipped Q1.',
    health: 100,
  },
  {
    id: 'proj-summit',
    name: 'Summit integrations',
    status: 'active',
    owner: 'Ada Fields',
    ownerAvatar: 'AF',
    updatedAt: '2026-06-09T11:00:00Z',
    description: 'Slack, Linear, and GitHub integrations for project notifications.',
    health: 84,
  },
  {
    id: 'proj-orbit',
    name: 'Orbit reporting',
    status: 'active',
    owner: 'Luca Rossi',
    ownerAvatar: 'LR',
    updatedAt: '2026-06-07T13:10:00Z',
    description: 'Scheduled PDF + CSV exports for execs and board updates.',
    health: 73,
  },
  {
    id: 'proj-nova',
    name: 'Nova billing',
    status: 'active',
    owner: 'Nia Patel',
    ownerAvatar: 'NP',
    updatedAt: '2026-06-08T18:42:00Z',
    description: 'Usage-based billing engine with seat reconciliation.',
    health: 67,
  },
]

export const teamMembers: TeamMember[] = [
  { id: 'u-1', name: 'Priya Kapoor', email: 'priya@helm.app', role: 'admin', avatar: 'PK', department: 'Design' },
  { id: 'u-2', name: 'Jordan Reyes', email: 'jordan@helm.app', role: 'admin', avatar: 'JR', department: 'Engineering' },
  { id: 'u-3', name: 'Sam Lin', email: 'sam@helm.app', role: 'editor', avatar: 'SL', department: 'Data' },
  { id: 'u-4', name: 'Mia Okafor', email: 'mia@helm.app', role: 'editor', avatar: 'MO', department: 'Mobile' },
  { id: 'u-5', name: 'Henry Choi', email: 'henry@helm.app', role: 'viewer', avatar: 'HC', department: 'Operations' },
  { id: 'u-6', name: 'Ada Fields', email: 'ada@helm.app', role: 'editor', avatar: 'AF', department: 'Engineering' },
  { id: 'u-7', name: 'Luca Rossi', email: 'luca@helm.app', role: 'viewer', avatar: 'LR', department: 'Marketing' },
  { id: 'u-8', name: 'Nia Patel', email: 'nia@helm.app', role: 'editor', avatar: 'NP', department: 'Design' },
]

export const kanbanCards: KanbanCard[] = [
  { id: 'k-1', title: 'Audit current typography system', column: 'todo', assignee: 'PK', labels: ['design'] },
  { id: 'k-2', title: 'Draft new color palette', column: 'todo', assignee: 'PK', labels: ['design'] },
  { id: 'k-3', title: 'Migrate icons to lucide', column: 'in-progress', assignee: 'NP', labels: ['design', 'frontend'] },
  { id: 'k-4', title: 'Wire up navigation analytics', column: 'in-progress', assignee: 'JR', labels: ['frontend'] },
  { id: 'k-5', title: 'Write release notes v4.1', column: 'in-progress', assignee: 'AF', labels: ['docs'] },
  { id: 'k-6', title: 'Ship dark mode toggle', column: 'done', assignee: 'JR', labels: ['frontend'] },
  { id: 'k-7', title: 'Add keyboard shortcut hints', column: 'done', assignee: 'AF', labels: ['frontend'] },
  { id: 'k-8', title: 'Accessibility audit pass', column: 'done', assignee: 'NP', labels: ['a11y'] },
]

export const activityFeed: ActivityItem[] = [
  { id: 'a-1', actor: 'Priya Kapoor', action: 'updated', target: 'Atlas rebrand', timestamp: '2 min ago' },
  { id: 'a-2', actor: 'Jordan Reyes', action: 'commented on', target: 'Compass onboarding', timestamp: '18 min ago' },
  { id: 'a-3', actor: 'Ada Fields', action: 'moved card to Done in', target: 'Summit integrations', timestamp: '42 min ago' },
  { id: 'a-4', actor: 'Mia Okafor', action: 'invited a teammate to', target: 'Horizon mobile', timestamp: '1 hour ago' },
  { id: 'a-5', actor: 'Sam Lin', action: 'paused', target: 'Vector analytics v2', timestamp: '3 hours ago' },
]

export const faqEntries = [
  {
    q: 'How do I invite a teammate?',
    a: 'Open the Team page and click "Invite". Share the link with your teammate — they sign up with their work email.',
  },
  {
    q: 'Can I export my analytics?',
    a: 'Yes. Open Analytics and click Export to download a CSV snapshot of every metric.',
  },
  {
    q: 'Where do I change my notification preferences?',
    a: 'Settings → Notifications. You can pick email, Slack, or in-app for each event type.',
  },
  {
    q: 'How does billing work?',
    a: 'Monthly or annual billing via Polar. Manage seats under Billing.',
  },
  {
    q: 'What keyboard shortcuts exist?',
    a: 'Press ⌘K anywhere to open the command palette and see the full list.',
  },
]

// Legacy 4-card strip kept for back-compat; the overview now renders `kpis`.
export const stats = [
  { label: 'Active projects', value: 6, delta: '+1 this week' },
  { label: 'Open tasks', value: 32, delta: '-5 since Monday' },
  { label: 'Teammates online', value: 6, delta: 'of 8' },
  { label: 'Completed this week', value: 18, delta: '+42% vs last week' },
]
