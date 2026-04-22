'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { type Role, teamMembers } from '@/lib/mock-data'
import { cn } from '@/lib/utils'
import { Mail, UserPlus } from 'lucide-react'

const roleStyle: Record<Role, string> = {
  admin: 'bg-primary/10 text-primary',
  editor: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
  viewer: 'bg-zinc-500/10 text-zinc-700 dark:text-zinc-400',
}

export default function TeamPage() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Team</h1>
          <p className="text-sm text-muted-foreground">
            {teamMembers.length} people who can see this workspace.
          </p>
        </div>
        <Button size="sm" onClick={() => window.dispatchEvent(new CustomEvent('team:invite-sent'))}>
          <UserPlus className="mr-1.5 h-4 w-4" />
          Invite
        </Button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {teamMembers.map((m) => (
          <Card key={m.id} className="group overflow-hidden transition hover:shadow-md">
            <div className="h-16 bg-gradient-to-br from-primary/20 via-primary/5 to-transparent" />
            <CardContent className="-mt-8 flex flex-col items-center gap-2 p-5 text-center">
              <Avatar className="h-14 w-14 ring-4 ring-background">
                <AvatarFallback className="text-sm font-medium">{m.avatar}</AvatarFallback>
              </Avatar>
              <div>
                <div className="font-medium leading-tight">{m.name}</div>
                <div className="mt-0.5 flex items-center justify-center gap-1 text-xs text-muted-foreground">
                  <Mail className="h-3 w-3" />
                  {m.email}
                </div>
              </div>
              <div className="mt-1 flex flex-wrap items-center justify-center gap-1.5">
                <span
                  className={cn(
                    'rounded-full px-2 py-0.5 text-[10px] font-medium capitalize',
                    roleStyle[m.role]
                  )}
                >
                  {m.role}
                </span>
                <Badge variant="outline" className="text-[10px] font-normal">
                  {m.department}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
