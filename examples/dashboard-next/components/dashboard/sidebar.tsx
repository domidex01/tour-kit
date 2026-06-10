'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { cn } from '@/lib/utils'
import {
  BarChart3,
  Compass,
  CreditCard,
  FolderKanban,
  LayoutDashboard,
  Settings,
  Users,
} from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const nav = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, tour: 'dashboard' },
  { href: '/dashboard/projects', label: 'Projects', icon: FolderKanban, tour: 'projects' },
  { href: '/dashboard/analytics', label: 'Analytics', icon: BarChart3, tour: 'analytics' },
  { href: '/dashboard/team', label: 'Team', icon: Users, tour: 'team' },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard, tour: 'billing' },
  { href: '/dashboard/settings', label: 'Settings', icon: Settings, tour: 'settings' },
]

export function DashboardSidebar() {
  const pathname = usePathname()
  return (
    <aside
      id="sidebar-nav"
      className="hidden w-64 flex-col border-r bg-sidebar text-sidebar-foreground md:flex"
    >
      <div className="flex h-14 items-center gap-2.5 border-b px-5">
        <div className="grid h-7 w-7 place-items-center rounded-lg bg-primary text-primary-foreground shadow-sm">
          <Compass className="h-4 w-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Helm</span>
          <span className="text-[10px] text-muted-foreground">Project analytics</span>
        </div>
      </div>

      <nav className="flex-1 space-y-0.5 p-3">
        <p className="px-3 pb-2 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </p>
        {nav.map(({ href, label, icon: Icon, tour }) => {
          const active = href === '/dashboard' ? pathname === href : pathname.startsWith(href)
          return (
            <Link
              key={href}
              href={href}
              id={`nav-${tour}`}
              data-tour={`nav-${tour}`}
              className={cn(
                'group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition',
                active
                  ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                  : 'text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground'
              )}
            >
              {active && (
                <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r-full bg-primary" />
              )}
              <Icon
                className={cn(
                  'h-4 w-4 transition',
                  active ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                )}
              />
              {label}
            </Link>
          )
        })}
      </nav>

      <div className="border-t p-3">
        <div className="flex items-center gap-3 rounded-md bg-background/60 px-2 py-2">
          <Avatar className="h-8 w-8 ring-2 ring-primary/20">
            <AvatarFallback className="text-[11px]">DM</AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-medium">Demo user</span>
            <span className="truncate text-xs text-muted-foreground">demo@helm.app</span>
          </div>
        </div>
      </div>
    </aside>
  )
}
