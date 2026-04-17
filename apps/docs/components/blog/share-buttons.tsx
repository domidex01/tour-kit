'use client'

import { Check, Copy, Linkedin, Rss, Twitter } from 'lucide-react'
import { useCallback, useState } from 'react'

interface ShareButtonsProps {
  url: string
  title: string
}

export function ShareButtons({ url, title }: ShareButtonsProps) {
  const [copied, setCopied] = useState(false)
  const fullUrl = `https://usertourkit.com${url}`

  const copyLink = useCallback(async () => {
    await navigator.clipboard.writeText(fullUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }, [fullUrl])

  const twitterUrl = `https://x.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(fullUrl)}`
  const linkedinUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(fullUrl)}`

  return (
    <div className="flex items-center gap-1.5">
      <span className="mr-1 text-[12px] text-fd-muted-foreground">Share</span>
      <button
        type="button"
        onClick={copyLink}
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label={copied ? 'Link copied' : 'Copy link'}
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="Share on X (Twitter)"
      >
        <Twitter className="h-3.5 w-3.5" />
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="Share on LinkedIn"
      >
        <Linkedin className="h-3.5 w-3.5" />
      </a>
      <a
        href="/blog/feed.xml"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="RSS feed"
      >
        <Rss className="h-3.5 w-3.5" />
      </a>
    </div>
  )
}
