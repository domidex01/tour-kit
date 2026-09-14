import { SectionHead } from '@/components/landing/section-head'
import type { ReactNode } from 'react'

interface DemoSectionProps {
  /** Uppercase label ("LIVE DEMO"). */
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
    <section className="px-6 py-24 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <p className="mb-3 text-[11px] font-semibold uppercase leading-[16.5px] tracking-[0.08em] text-[var(--color-fd-primary)]">
          {eyebrow}
        </p>
        <SectionHead size="section" title={heading}>
          {subtext}
        </SectionHead>
        <div className="mt-10">{children}</div>
      </div>
    </section>
  )
}
