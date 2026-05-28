import { baseOptions } from '@/lib/layout.shared'
import { source } from '@/lib/source'
import { DocsLayout } from 'fumadocs-ui/layouts/docs'
import type { ReactNode } from 'react'

export default function Layout({ children }: { children: ReactNode }) {
  return (
    <DocsLayout
      {...baseOptions()}
      tree={source.pageTree}
      sidebar={{
        banner: (
          <div
            key="sidebar-banner"
            className="flex items-center gap-2 px-2 py-1.5 text-sm text-fd-muted-foreground"
          >
            <span className="inline-flex items-center rounded-full bg-[var(--tk-primary)] px-2 py-0.5 text-xs font-medium text-white">
              v0.1.0
            </span>
            <span>Beta Release</span>
          </div>
        ),
      }}
    >
      {/*
        `display: contents` (not a grid box): DocsPage renders both the article
        and the TOC, each with its own grid-area. Wrapping them in a single
        `[grid-area:main]` box trapped the TOC inside the content column (it fell
        to the bottom-left and left the right rail empty). `contents` lets the
        article + TOC participate directly in DocsLayout's grid. We keep
        <main id="main-content"> for the skip-link target.
      */}
      <main id="main-content" className="contents">
        {children}
      </main>
    </DocsLayout>
  )
}
