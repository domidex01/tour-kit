import type { ReactNode } from 'react'

interface DemoSurfaceProps {
  /** Fake URL shown in the browser-chrome address bar. */
  url?: string
  children: ReactNode
  /** Extra classes for the content area (min-height etc). */
  contentClassName?: string
}

/**
 * Browser-chrome frame for the live demos — same mockup language as the home
 * hero (traffic lights + address bar over a frosted card).
 */
export function DemoSurface({
  url = 'your-app.com',
  children,
  contentClassName,
}: DemoSurfaceProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/20 bg-fd-card/80 shadow-2xl shadow-[#02182b]/10 backdrop-blur-xl dark:border-white/10">
      {/* Browser chrome */}
      <div className="flex items-center gap-2 border-b border-fd-border/50 bg-fd-muted/30 px-4 py-2.5 backdrop-blur-sm">
        <div className="flex gap-1.5" aria-hidden="true">
          <div className="h-2.5 w-2.5 rounded-full bg-[#d7263d]/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#febc2e]/80" />
          <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]/80" />
        </div>
        <div className="ml-2 flex-1 rounded-md bg-fd-background/50 px-3 py-1 text-[11px] text-fd-muted-foreground">
          {url}
        </div>
      </div>

      <div className={`relative p-6 ${contentClassName ?? ''}`}>{children}</div>
    </div>
  )
}

/** Decorative skeleton row for the mock app behind a demo. */
export function MockRow({ width = 'w-full' }: { width?: string }) {
  return <div aria-hidden="true" className={`h-2.5 rounded bg-fd-foreground/5 ${width}`} />
}
