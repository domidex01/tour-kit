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
      {children}
    </DocsLayout>
  )
}
