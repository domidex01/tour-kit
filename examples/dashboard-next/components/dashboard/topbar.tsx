'use client'

import { ThemeToggle } from '@/components/theme-toggle'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Input } from '@/components/ui/input'
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Bell, ChevronRight, Keyboard, Menu, Search } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DashboardSidebar } from './sidebar'

function useCrumbs() {
  const pathname = usePathname()
  const parts = pathname.split('/').filter(Boolean)
  const crumbs: { label: string; href: string }[] = []
  let acc = ''
  for (const part of parts) {
    acc += `/${part}`
    crumbs.push({ label: part.replace(/-/g, ' '), href: acc })
  }
  return crumbs
}

export function DashboardTopbar() {
  const crumbs = useCrumbs()
  return (
    <header className="flex h-14 items-center gap-3 border-b bg-background px-4 md:px-6">
      <Sheet>
        <SheetTrigger
          render={
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Open navigation">
              <Menu className="h-4 w-4" />
            </Button>
          }
        />
        <SheetContent side="left" className="p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <DashboardSidebar />
        </SheetContent>
      </Sheet>

      <nav
        aria-label="Breadcrumb"
        className="hidden items-center gap-1 text-sm text-muted-foreground md:flex"
      >
        {crumbs.map((c, i) => (
          <span key={c.href} className="flex items-center gap-1">
            {i > 0 && <ChevronRight className="h-3.5 w-3.5" />}
            <Link href={c.href} className="capitalize hover:text-foreground">
              {c.label}
            </Link>
          </span>
        ))}
      </nav>

      <div className="ml-auto flex items-center gap-2">
        <div className="relative hidden md:block">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            id="search-input"
            placeholder="Search…"
            className="w-56 pl-8"
            aria-label="Global search"
          />
          <kbd className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 rounded border bg-muted px-1 text-[10px] text-muted-foreground">
            ⌘K
          </kbd>
        </div>

        <Button
          id="shortcuts-btn"
          variant="ghost"
          size="icon"
          aria-label="Keyboard shortcuts"
          onClick={() => window.dispatchEvent(new CustomEvent('shortcuts:opened'))}
        >
          <Keyboard className="h-4 w-4" />
        </Button>

        <ThemeToggle />

        <Button id="notifications-btn" variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <button
                type="button"
                id="user-menu"
                className="rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>DM</AvatarFallback>
                </Avatar>
              </button>
            }
          />
          <DropdownMenuContent align="end">
            <DropdownMenuItem render={<Link href="/dashboard/settings">Settings</Link>} />
            <DropdownMenuItem render={<Link href="/dashboard/settings">Billing</Link>} />
            <DropdownMenuSeparator />
            <DropdownMenuItem render={<Link href="/">Sign out</Link>} />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
