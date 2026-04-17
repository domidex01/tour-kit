'use client'

import { useTour } from '@tour-kit/core'
import type { RouterAdapter, TourStep } from '@tour-kit/core'
import * as React from 'react'
import { cn } from '../../lib/utils'
import { TourPortal } from '../primitives/tour-portal'

interface TourRoutePromptProps {
  /** Router adapter (required for navigation) */
  router: RouterAdapter
  /** Custom className */
  className?: string
  /** Custom message */
  message?: string | ((route: string, stepTitle?: string) => string)
  /** Custom button text */
  buttonText?: string
  /** Custom cancel text */
  cancelText?: string
  /** Called when user chooses to navigate */
  onNavigate?: (route: string) => void
  /** Called when user skips the tour */
  onSkip?: () => void
}

interface PendingNavigation {
  route: string
  stepId: string
  stepTitle?: string
}

/**
 * Prompt shown when user needs to navigate to a different page
 * to continue the tour.
 *
 * Only shown when autoNavigate is false and navigation is needed.
 *
 * @example
 * ```tsx
 * <TourRoutePrompt
 *   router={router}
 *   message={(route) => `Continue to ${route}?`}
 *   buttonText="Let's Go"
 * />
 * ```
 */
export function TourRoutePrompt({
  router,
  className,
  message,
  buttonText = 'Continue',
  cancelText = 'Skip Tour',
  onNavigate,
  onSkip,
}: TourRoutePromptProps) {
  const [pendingNavigation, setPendingNavigation] = React.useState<PendingNavigation | null>(null)
  const dialogRef = React.useRef<HTMLDialogElement>(null)
  const tour = useTour()

  // Check if current step requires navigation
  React.useEffect(() => {
    const step = tour.currentStep as TourStep | null
    if (!step?.route || !tour.isActive) {
      setPendingNavigation(null)
      return
    }

    const matchMode = step.routeMatch ?? 'exact'
    const isOnCorrectRoute = router.matchRoute(step.route, matchMode)

    if (!isOnCorrectRoute) {
      setPendingNavigation({
        route: step.route,
        stepId: step.id,
        stepTitle: typeof step.title === 'string' ? step.title : undefined,
      })
    } else {
      setPendingNavigation(null)
    }
  }, [tour.currentStep, tour.isActive, router])

  // Show/hide dialog based on pending navigation
  React.useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (pendingNavigation) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [pendingNavigation])

  if (!pendingNavigation) return null

  const getMessage = () => {
    if (typeof message === 'function') {
      return message(pendingNavigation.route, pendingNavigation.stepTitle)
    }
    if (message) return message
    return `To continue the tour, we need to go to ${pendingNavigation.route}`
  }

  const handleNavigate = async () => {
    onNavigate?.(pendingNavigation.route)
    await router.navigate(pendingNavigation.route)
    setPendingNavigation(null)
  }

  const handleSkip = () => {
    onSkip?.()
    tour.skip()
    setPendingNavigation(null)
  }

  return (
    <TourPortal>
      <dialog
        ref={dialogRef}
        className="fixed inset-0 z-50 flex items-center justify-center bg-transparent backdrop:bg-black/50"
        aria-labelledby="tour-route-prompt-title"
      >
        <div
          className={cn(
            'max-w-md rounded-lg border bg-popover p-6 text-popover-foreground shadow-lg',
            className
          )}
        >
          <h3 id="tour-route-prompt-title" className="text-lg font-semibold mb-2">
            Continue Tour?
          </h3>
          <p className="text-muted-foreground mb-4">{getMessage()}</p>
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={handleSkip}
              className="px-4 py-2 rounded-md border hover:bg-muted transition-colors"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={handleNavigate}
              className="px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {buttonText}
            </button>
          </div>
        </div>
      </dialog>
    </TourPortal>
  )
}
