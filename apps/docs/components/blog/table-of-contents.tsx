'use client'

import type { TOCItemType } from 'fumadocs-core/toc'
import { useEffect, useState } from 'react'

interface BlogTocProps {
  items: TOCItemType[]
}

export function BlogTableOfContents({ items }: BlogTocProps) {
  const headings = items.filter((item) => item.depth === 2)
  const [activeId, setActiveId] = useState<string>('')

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id)
          }
        }
      },
      { rootMargin: '-80px 0px -60% 0px' }
    )

    for (const heading of headings) {
      const id = heading.url.replace('#', '')
      const el = document.getElementById(id)
      if (el) observer.observe(el)
    }

    return () => observer.disconnect()
  }, [headings])

  if (headings.length === 0) return null

  return (
    <nav aria-label="Table of contents" className="not-prose">
      {/* Mobile: collapsible inline */}
      <details className="group mb-10 rounded-xl border border-fd-border bg-fd-card xl:hidden">
        <summary className="flex cursor-pointer select-none items-center gap-2 px-5 py-4 text-[14px] font-semibold text-fd-foreground">
          <svg
            className="h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform group-open:rotate-90"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
              clipRule="evenodd"
            />
          </svg>
          In this article
        </summary>
        <ol className="border-t border-fd-border px-5 py-4">
          {headings.map((item, i) => (
            <li key={item.url}>
              <a
                href={item.url}
                className="flex items-baseline gap-3 rounded-md px-2 py-1.5 text-[13px] leading-snug text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-foreground"
              >
                <span className="shrink-0 font-mono text-[11px] text-fd-muted-foreground/60">
                  {String(i + 1).padStart(2, '0')}
                </span>
                {item.title}
              </a>
            </li>
          ))}
        </ol>
      </details>

      {/* Desktop: sidebar list (rendered inside sticky parent from ArticleLayout) */}
      <div className="hidden xl:block">
        <p className="mb-3 text-[12px] font-semibold text-fd-muted-foreground">On this page</p>
        <ol className="space-y-0.5 border-l border-fd-border">
          {headings.map((item) => {
            const id = item.url.replace('#', '')
            const isActive = activeId === id
            return (
              <li key={item.url}>
                <a
                  href={item.url}
                  className={`-ml-px block border-l-2 py-1 pl-3 text-[12px] leading-snug transition-colors ${
                    isActive
                      ? 'border-[#0197f6] text-fd-foreground'
                      : 'border-transparent text-fd-muted-foreground hover:text-fd-foreground'
                  }`}
                >
                  {item.title}
                </a>
              </li>
            )
          })}
        </ol>
      </div>
    </nav>
  )
}
