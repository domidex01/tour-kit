import type React from 'react'
import type { Placement } from './config'
import type { TourContext } from './state'

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
  when?: (context: TourContext) => boolean | Promise<boolean>
  waitForTarget?: boolean
  waitTimeout?: number
  onBeforeShow?: (
    context: TourContext
  ) => void | boolean | Promise<void | boolean>
  onShow?: (context: TourContext) => void
  onBeforeHide?: (
    context: TourContext
  ) => void | boolean | Promise<void | boolean>
  onHide?: (context: TourContext) => void
}

export type StepOptions = Omit<TourStep, 'id'>
