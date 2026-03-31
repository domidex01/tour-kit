'use client'

import type { CSSProperties } from 'react'

const overlayStyle: CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 2147483647,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
}

const textStyle: CSSProperties = {
  fontSize: '6rem',
  fontWeight: 900,
  color: 'rgba(0, 0, 0, 0.08)',
  transform: 'rotate(-45deg)',
  userSelect: 'none',
  whiteSpace: 'nowrap',
  fontFamily: 'system-ui, sans-serif',
  letterSpacing: '0.1em',
  textTransform: 'uppercase',
}

export function LicenseWatermark() {
  return (
    <div style={overlayStyle}>
      <span style={textStyle}>UNLICENSED</span>
    </div>
  )
}
