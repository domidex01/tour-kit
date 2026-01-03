import * as React from 'react'
import { createPortal } from 'react-dom'

export interface TourPortalProps {
  children: React.ReactNode
  /** Container element for the portal. Defaults to document.body */
  container?: HTMLElement | null
}

export const TourPortal = React.forwardRef<HTMLDivElement, TourPortalProps>(
  ({ children, container }, ref) => {
    const [mounted, setMounted] = React.useState(false)

    React.useEffect(() => {
      setMounted(true)
    }, [])

    if (!mounted) return null

    const portalContainer = container ?? document.body

    return createPortal(<div ref={ref}>{children}</div>, portalContainer)
  }
)
TourPortal.displayName = 'TourPortal'
