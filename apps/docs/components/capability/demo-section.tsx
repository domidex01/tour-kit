import type { ReactNode } from 'react'

interface DemoSectionProps {
  /** Mono uppercase label ("LIVE DEMO"). */
  eyebrow?: string
  heading: string
  /** Names the proof: this is the real component, not a video. */
  subtext: string
  children: ReactNode
}

/**
 * Wrapper for the live demo — the section no signup-walled competitor page
 * can offer. The demo itself is a dynamically imported client component
 * passed as children; this wrapper stays server-rendered.
 */
export function DemoSection({
  eyebrow = 'Live demo',
  heading,
  subtext,
  children,
}: DemoSectionProps) {
  return (
    <section className="px-6 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 max-w-lg">
          <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0197f6]">
            {eyebrow}
          </p>
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {heading}
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">{subtext}</p>
        </div>
        {children}
      </div>
    </section>
  )
}
