'use client'

import * as React from 'react'
import { useLicenseGate } from '../hooks/use-license-gate'

export interface ProGateProps {
  /** The npm package name being gated (shown in placeholder + console) */
  package: string
  children: React.ReactNode
}

const placeholderContainerStyles: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '24px',
  minHeight: '80px',
  border: '1px solid #e5e7eb',
  borderRadius: '8px',
  backgroundColor: '#f9fafb',
  fontFamily:
    '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
}

const placeholderInnerStyles: React.CSSProperties = {
  textAlign: 'center',
  maxWidth: '400px',
}

const titleStyles: React.CSSProperties = {
  margin: '0 0 8px 0',
  fontSize: '14px',
  fontWeight: 600,
  color: '#374151',
}

const packageStyles: React.CSSProperties = {
  display: 'block',
  marginBottom: '8px',
  fontSize: '12px',
  fontFamily: 'monospace',
  color: '#6b7280',
}

const linkStyles: React.CSSProperties = {
  fontSize: '13px',
  color: '#2563eb',
  textDecoration: 'underline',
}

/**
 * Hard gate for Tour Kit Pro packages.
 * Renders children when licensed, a branded placeholder when not.
 * Dev environments (localhost, 127.0.0.1, *.local) always render children.
 */
export function ProGate({ package: packageName, children }: ProGateProps) {
  const { isGated, isLoading } = useLicenseGate()
  const warnedRef = React.useRef(false)

  React.useEffect(() => {
    if (isGated && !isLoading && !warnedRef.current) {
      warnedRef.current = true
      console.error(
        `[${packageName}] Tour Kit Pro license required. Add a <LicenseProvider> with a valid license key. Get one at https://tourkit.dev/pricing`
      )
    }
  }, [isGated, isLoading, packageName])

  // Loading or licensed — render children
  if (!isGated) {
    return <>{children}</>
  }

  // Gated — render placeholder
  return (
    <div style={placeholderContainerStyles} role="status" aria-label="License required">
      <div style={placeholderInnerStyles}>
        <p style={titleStyles}>Tour Kit Pro license required</p>
        <span style={packageStyles}>{packageName}</span>
        <a
          href="https://tourkit.dev/pricing"
          target="_blank"
          rel="noopener noreferrer"
          style={linkStyles}
        >
          Get a license →
        </a>
      </div>
    </div>
  )
}
