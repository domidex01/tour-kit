import * as React from 'react'
import { createPortal } from 'react-dom'

interface TourPortalProps {
  children: React.ReactNode
  container?: HTMLElement
}

export function TourPortal({ children, container }: TourPortalProps) {
  const [mounted, setMounted] = React.useState(false)

  React.useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, container ?? document.body)
}
