'use client'

import { Check, Copy, Rss } from 'lucide-react'
import { useCallback, useState } from 'react'

interface ShareButtonsProps {
  url: string
  title: string
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>X</title>
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.838l-5.35-6.993L3.6 22H.84l6.96-7.957L1.5 2h6.99l4.844 6.398L18.244 2Zm-1.196 18.168h1.89L6.94 3.735H4.91l12.138 16.433Z" />
    </svg>
  )
}

function LinkedinIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg" {...props}>
      <title>LinkedIn</title>
      <path d="M20.447 20.452H16.89V14.88c0-1.328-.026-3.036-1.852-3.036-1.853 0-2.136 1.445-2.136 2.94v5.667H9.347V9h3.414v1.561h.048c.476-.9 1.636-1.85 3.367-1.85 3.6 0 4.267 2.37 4.267 5.455v6.286ZM5.337 7.433a2.062 2.062 0 0 1-2.063-2.065 2.063 2.063 0 1 1 2.063 2.065Zm1.778 13.019H3.555V9h3.56v11.452ZM22.225 0H1.771C.791 0 0 .774 0 1.729v20.542C0 23.227.791 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
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
        {copied ? (
          <Check className="h-3.5 w-3.5" aria-hidden="true" />
        ) : (
          <Copy className="h-3.5 w-3.5" aria-hidden="true" />
        )}
      </button>
      <a
        href={twitterUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="Share on X (Twitter)"
      >
        <XIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <a
        href={linkedinUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="Share on LinkedIn"
      >
        <LinkedinIcon className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
      <a
        href="/blog/feed.xml"
        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-fd-border text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        aria-label="RSS feed"
      >
        <Rss className="h-3.5 w-3.5" aria-hidden="true" />
      </a>
    </div>
  )
}
