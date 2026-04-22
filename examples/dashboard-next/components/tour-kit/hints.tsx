'use client'

import { Hint } from '@tour-kit/hints'

export function DarkModeHint() {
  return (
    <Hint
      id="dark-mode-hint"
      target="#dark-mode-toggle"
      position="top-right"
      persist
      pulse
      content="New: dark mode is here — click to toggle"
    />
  )
}

export function ExportHint() {
  return (
    <Hint
      id="export-hint"
      target="#export-btn"
      position="top-right"
      persist
      pulse
      content="Export your board as CSV"
    />
  )
}
