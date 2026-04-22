'use client'

import { AiChatHost } from '@/components/tour-kit/ai-chat-host'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { faqEntries } from '@/lib/mock-data'
import { useAiChat } from '@tour-kit/ai'
import { BookOpen, HelpCircle, MessageCircle, Search, Sparkles } from 'lucide-react'
import { useMemo, useState } from 'react'

function AskAiLauncher() {
  const { toggle, isOpen } = useAiChat()
  return (
    <Button
      id="help-launcher"
      onClick={() => toggle()}
      className="fixed bottom-6 left-6 h-11 rounded-full px-4 shadow-xl ring-1 ring-foreground/5"
      aria-label={isOpen ? 'Close AI assistant' : 'Open AI assistant'}
    >
      <Sparkles className="mr-1.5 h-4 w-4" />
      Ask AI
    </Button>
  )
}

const quickLinks = [
  {
    icon: BookOpen,
    title: 'Read the docs',
    description: 'Guides, reference, and examples.',
  },
  {
    icon: MessageCircle,
    title: 'Chat with support',
    description: 'Median response time: 4 minutes.',
  },
  {
    icon: HelpCircle,
    title: 'Community forum',
    description: '12k+ teams sharing patterns.',
  },
]

export default function HelpPage() {
  const [query, setQuery] = useState('')
  const filtered = useMemo(() => {
    const q = query.toLowerCase().trim()
    if (!q) return faqEntries
    return faqEntries.filter((f) => f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q))
  }, [query])

  return (
    <div className="mx-auto w-full max-w-3xl space-y-8 p-6">
      <div className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-background p-8 text-center">
        <h1 className="text-2xl font-semibold tracking-tight">How can we help?</h1>
        <p className="mx-auto mt-1 max-w-md text-sm text-muted-foreground">
          Search the docs, ask the AI assistant, or browse common questions.
        </p>
        <div className="relative mx-auto mt-5 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            aria-label="Search help"
            placeholder="Search for answers…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="h-11 pl-9 shadow-sm"
          />
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        {quickLinks.map(({ icon: Icon, title, description }) => (
          <Card key={title} className="cursor-pointer transition hover:shadow-md">
            <CardContent className="flex flex-col gap-2 p-4">
              <div className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary">
                <Icon className="h-4 w-4" />
              </div>
              <div>
                <div className="text-sm font-medium">{title}</div>
                <div className="text-xs text-muted-foreground">{description}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
          Frequently asked
        </h2>
        {filtered.map((f) => (
          <Card key={f.q} className="transition hover:border-foreground/20">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{f.q}</CardTitle>
              <CardDescription className="text-sm leading-relaxed">{f.a}</CardDescription>
            </CardHeader>
          </Card>
        ))}
        {filtered.length === 0 && (
          <div className="rounded-md border border-dashed p-6 text-center text-sm text-muted-foreground">
            No matches. Try asking the AI assistant.
          </div>
        )}
      </div>

      <AskAiLauncher />
      <AiChatHost />
    </div>
  )
}
