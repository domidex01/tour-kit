'use client'

import { HintHotspot } from '@tour-kit/hints'
import { useEffect, useRef, useState } from 'react'

/**
 * Playwright fixture route for Phase 3 (Hint Presets).
 *
 * Six anchored cells (3 variants × light/dark backgrounds). Each cell holds
 * a fixed-size anchor div so `getHotspotPosition` resolves to deterministic
 * coordinates regardless of viewport. Not linked from public nav.
 */
export default function HintVariantsPage() {
  return (
    <div className="min-h-screen p-6 grid grid-cols-2 gap-6">
      <Cell testId="badge-light" theme="light">
        <BadgeAnchor />
      </Cell>
      <Cell testId="badge-dark" theme="dark">
        <BadgeAnchor />
      </Cell>
      <Cell testId="beacon-with-label-light" theme="light">
        <BeaconAnchor />
      </Cell>
      <Cell testId="beacon-with-label-dark" theme="dark">
        <BeaconAnchor />
      </Cell>
      <Cell testId="whats-new-pill-light" theme="light">
        <PillAnchor />
      </Cell>
      <Cell testId="whats-new-pill-dark" theme="dark">
        <PillAnchor />
      </Cell>
    </div>
  )
}

interface CellProps {
  testId: string
  theme: 'light' | 'dark'
  children: React.ReactNode
}

function Cell({ testId, theme, children }: CellProps) {
  const background = theme === 'light' ? '#ffffff' : '#0a0a0a'
  return (
    <section
      data-testid={testId}
      style={{ background, padding: 48 }}
      className="relative flex items-center justify-center min-h-[200px] rounded-lg border"
    >
      {children}
    </section>
  )
}

function useAnchorRect() {
  const ref = useRef<HTMLDivElement>(null)
  const [rect, setRect] = useState<DOMRect | null>(null)
  useEffect(() => {
    if (!ref.current) return
    setRect(ref.current.getBoundingClientRect())
  }, [])
  return { ref, rect }
}

function BadgeAnchor() {
  const { ref, rect } = useAnchorRect()
  return (
    <>
      <div ref={ref} style={{ width: 100, height: 40 }} className="bg-muted rounded-md" />
      {rect ? (
        <HintHotspot variant="badge" count={3} targetRect={rect} position="top-right" />
      ) : null}
    </>
  )
}

function BeaconAnchor() {
  const { ref, rect } = useAnchorRect()
  return (
    <>
      <div ref={ref} style={{ width: 100, height: 40 }} className="bg-muted rounded-md" />
      {rect ? (
        <HintHotspot
          variant="beacon-with-label"
          label="New"
          targetRect={rect}
          position="top-right"
        />
      ) : null}
    </>
  )
}

function PillAnchor() {
  const { ref, rect } = useAnchorRect()
  return (
    <>
      <div ref={ref} style={{ width: 100, height: 40 }} className="bg-muted rounded-md" />
      {rect ? (
        <HintHotspot
          variant="what-s-new-pill"
          label="What's new"
          targetRect={rect}
          position="top-right"
        />
      ) : null}
    </>
  )
}
