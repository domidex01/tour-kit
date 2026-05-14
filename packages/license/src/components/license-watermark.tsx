'use client'

import { type CSSProperties, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const WATERMARK_URL =
  'https://usertourkit.com/pricing?utm_source=unlicensed_badge&utm_medium=in_app&utm_campaign=watermark'

const wrapperStyle: CSSProperties = {
  position: 'fixed',
  right: '16px',
  bottom: '16px',
  zIndex: 2147483647,
  pointerEvents: 'none',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const linkStyle: CSSProperties = {
  pointerEvents: 'auto',
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '6px 10px',
  borderRadius: '8px',
  background: 'rgba(17, 24, 39, 0.92)',
  color: '#fff',
  fontSize: '12px',
  lineHeight: 1.2,
  textDecoration: 'none',
  boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
}

const dotStyle: CSSProperties = {
  width: '6px',
  height: '6px',
  borderRadius: '50%',
  background: '#fbbf24',
  display: 'inline-block',
}

const labelStyle: CSSProperties = {
  fontWeight: 600,
}

const ctaStyle: CSSProperties = {
  marginLeft: '6px',
  opacity: 0.85,
  textDecoration: 'underline',
}

type WindowWithAnalytics = Window & {
  gtag?: (event: 'event', name: string, params: Record<string, unknown>) => void
  dataLayer?: Array<Record<string, unknown>>
}

type WatermarkInstance = {
  id: symbol
  setOwner: (isOwner: boolean) => void
}

const instances: WatermarkInstance[] = []
let ownerId: symbol | null = null

function electOwner(): void {
  ownerId = instances[0]?.id ?? null
  for (const instance of instances) {
    instance.setOwner(instance.id === ownerId)
  }
}

function dispatchClickEvent(): void {
  if (typeof window === 'undefined') return

  const win = window as WindowWithAnalytics
  const hostname = window.location?.hostname ?? ''
  const payload = {
    placement: 'watermark',
    hostname,
  }

  try {
    if (typeof win.gtag === 'function') {
      win.gtag('event', 'unlicensed_badge_clicked', payload)
      return
    }
    if (Array.isArray(win.dataLayer)) {
      win.dataLayer.push({ event: 'unlicensed_badge_clicked', ...payload })
    }
  } catch {
    // Analytics dispatch must never throw.
  }
}

export function LicenseWatermark() {
  const [isOwner, setIsOwner] = useState(false)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const entry: WatermarkInstance = {
      id: Symbol('watermark'),
      setOwner: setIsOwner,
    }
    instances.push(entry)
    electOwner()

    return () => {
      const idx = instances.findIndex((x) => x.id === entry.id)
      if (idx !== -1) instances.splice(idx, 1)
      electOwner()
    }
  }, [])

  if (!mounted || !isOwner) return null
  if (typeof document === 'undefined') return null

  return createPortal(
    <div
      data-tourkit-watermark=""
      role="region"
      aria-label="Tour Kit license required"
      style={wrapperStyle}
    >
      <a
        href={WATERMARK_URL}
        target="_blank"
        rel="noopener noreferrer"
        style={linkStyle}
        onClick={dispatchClickEvent}
        aria-label="Tour Kit unlicensed — buy a license"
      >
        <span style={dotStyle} aria-hidden="true" />
        <span style={labelStyle}>Tour Kit</span>
        <span aria-hidden="true">·</span>
        <span>Unlicensed</span>
        <span style={ctaStyle}>Buy license</span>
      </a>
    </div>,
    document.body
  )
}
