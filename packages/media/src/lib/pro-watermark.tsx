import * as React from 'react'
import { useLicenseCheck } from './use-license-check'

const PACKAGE_NAME = '@tour-kit/media'

const watermarkStyles: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 2147483647,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  opacity: 0.12,
  fontSize: '14px',
  fontFamily: 'monospace',
  fontWeight: 700,
  color: '#000',
  userSelect: 'none',
  letterSpacing: '2px',
  textTransform: 'uppercase',
}

export function ProWatermark() {
  const { isLicensed, isLoading } = useLicenseCheck()
  const warnedRef = React.useRef(false)

  React.useEffect(() => {
    if (!isLicensed && !isLoading && !warnedRef.current) {
      warnedRef.current = true
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[${PACKAGE_NAME}] Unlicensed usage detected. Purchase a license at tourkit.dev/pricing`
        )
      }
    }
  }, [isLicensed, isLoading])

  if (isLicensed || isLoading) return null

  return (
    <div style={watermarkStyles} aria-hidden="true">
      UNLICENSED
    </div>
  )
}
