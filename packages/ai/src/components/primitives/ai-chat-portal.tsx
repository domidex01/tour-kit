'use client'

import { type ReactNode, useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

export interface AiChatPortalProps {
  children: ReactNode
  container?: HTMLElement | null
}

export function AiChatPortal({ children, container }: AiChatPortalProps) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null

  return createPortal(children, container ?? document.body)
}
