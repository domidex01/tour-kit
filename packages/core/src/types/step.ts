import type React from 'react'
import type { Placement } from './config'
import type { TourCallbackContext } from './state'

/**
 * Single step in a tour
 */
export interface TourStep {
  id: string
  target: string | React.RefObject<HTMLElement | null>
  title?: React.ReactNode
  content: React.ReactNode
  placement?: Placement
  offset?: [number, number]
  showNavigation?: boolean
  showClose?: boolean
  showProgress?: boolean
  className?: string
  spotlightPadding?: number
  spotlightRadius?: number
  interactive?: boolean
  advanceOn?: {
    event: 'click' | 'input' | 'custom'
    selector?: string
    handler?: () => boolean
  }
  route?: string
  routeDelay?: number
  when?: (context: TourCallbackContext) => boolean | Promise<boolean>
  waitForTarget?: boolean
  waitTimeout?: number
  onBeforeShow?: (context: TourCallbackContext) => void | boolean | Promise<void | boolean>
  onShow?: (context: TourCallbackContext) => void
  onBeforeHide?: (context: TourCallbackContext) => void | boolean | Promise<void | boolean>
  onHide?: (context: TourCallbackContext) => void
}

export type StepOptions = Omit<TourStep, 'id'>
