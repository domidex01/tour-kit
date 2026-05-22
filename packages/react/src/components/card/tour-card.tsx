'use client'

import {
  type Placement as FloatingPlacement,
  arrow,
  autoUpdate,
  flip,
  offset,
  shift,
  useFloating,
} from '@floating-ui/react'
import {
  type Placement,
  logger,
  resolveTarget,
  useFocusTrap,
  useReducedMotion,
  useTour,
} from '@tour-kit/core'
import { cn } from '@tour-kit/core'
import { MediaSlot } from '@tour-kit/media'
import * as React from 'react'
import { useResolvedText } from '../../hooks/use-resolved-text'
import { TourArrow } from '../primitives/tour-arrow'
import { TourPortal } from '../primitives/tour-portal'
import { type TourCardVariants, tourCardVariants } from '../ui/card-variants'
import { TourCardContent } from './tour-card-content'
import { TourCardFooter } from './tour-card-footer'
import { TourCardHeader } from './tour-card-header'

// Map our Placement type to floating-ui Placement
function toFloatingPlacement(placement?: Placement): FloatingPlacement {
  if (!placement) return 'bottom'
  return placement.replace('-center', '') as FloatingPlacement
}

// Module-level dedup so `variant="classic"` warns once per step id even
// across re-renders. Reset between tests via `vi.resetModules()`.
const warnedClassicStepIds = new Set<string>()

export interface TourCardProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardVariants {
  /** Show "N / M" indicator inside the header. Default: true on `variant="refreshed"`, false on `variant="classic"`. */
  showStepIndicator?: boolean
  /** Floating UI arrow size in pixels. Default: 8. */
  arrowSize?: number
}

/**
 * TourCard - The main tour step card component
 *
 * Displays the current tour step with title, content, navigation, and progress.
 * Follows shadcn/ui patterns and can be customized via variants and className.
 *
 * @example
 * // Basic usage (automatically positioned by useTour)
 * <TourCard />
 *
 * @example
 * // With size variant
 * <TourCard size="lg" />
 *
 * @example
 * // Pin v1 layout for one minor cycle while updating themes
 * <TourCard variant="classic" />
 *
 * @see {@link TourCardProps} for available props
 * @see {@link tourCardVariants} for available variants
 */
export const TourCard = React.forwardRef<HTMLDivElement, TourCardProps>(
  ({ className, size, variant = 'refreshed', showStepIndicator, arrowSize, ...props }, ref) => {
    const {
      isActive,
      currentStep,
      currentStepIndex,
      totalSteps,
      next,
      prev,
      skip,
      isFirstStep,
      isLastStep,
    } = useTour()

    const arrowRef = React.useRef<SVGSVGElement>(null)
    const reducedMotion = useReducedMotion()
    const { containerRef, activate, deactivate } = useFocusTrap(isActive)

    const targetElement = React.useMemo(() => {
      if (!currentStep?.target) return null
      return resolveTarget(currentStep.target)
    }, [currentStep?.target])

    const { refs, floatingStyles, context } = useFloating({
      open: isActive,
      placement: toFloatingPlacement(currentStep?.placement),
      middleware: [
        offset(currentStep?.offset?.[1] ?? 12),
        flip({ fallbackAxisSideDirection: 'start' }),
        shift({ padding: 8 }),
        arrow({ element: arrowRef }),
      ],
      whileElementsMounted: autoUpdate,
    })

    React.useEffect(() => {
      if (targetElement) {
        refs.setReference(targetElement)
      }
    }, [targetElement, refs])

    React.useEffect(() => {
      if (isActive) {
        activate()
      } else {
        deactivate()
      }
    }, [isActive, activate, deactivate])

    // Emit deprecation warning once per step id when classic variant is in use.
    React.useEffect(() => {
      if (variant !== 'classic' || !currentStep?.id) return
      if (process.env.NODE_ENV === 'production') return
      if (warnedClassicStepIds.has(currentStep.id)) return
      warnedClassicStepIds.add(currentStep.id)
      logger.warn(
        'react: <TourCard variant="classic"> is deprecated and will be removed in the next major. See https://usertourkit.com/docs/react/components/tour-card-migration'
      )
    }, [variant, currentStep?.id])

    const resolvedTitle = useResolvedText(currentStep?.title)
    const resolvedDescription = useResolvedText(currentStep?.description)

    if (!isActive || !currentStep) return null

    const showNavigation = currentStep.showNavigation ?? true
    const showClose = currentStep.showClose ?? true
    const showProgress = currentStep.showProgress ?? true

    const isRefreshed = variant !== 'classic'
    const indicatorEnabled = showStepIndicator ?? isRefreshed
    const stepIndicator = indicatorEnabled
      ? { current: currentStepIndex + 1, total: totalSteps }
      : null

    const stepLabel = `Step ${currentStepIndex + 1} of ${totalSteps}`
    const ariaLabel = resolvedTitle ? `${stepLabel}: ${resolvedTitle}` : stepLabel

    return (
      <TourPortal>
        <div
          ref={(node) => {
            refs.setFloating(node)
            if (containerRef) {
              containerRef.current = node
            }
            // Forward the ref
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          style={floatingStyles}
          className={cn(
            tourCardVariants({ size, variant }),
            'z-50',
            !reducedMotion && 'transition-[transform,top,left] duration-150 ease-out',
            currentStep.className,
            className
          )}
          {...props}
          // The dialog contract (role / aria-modal / aria-label) and the
          // tour data attributes are load-bearing for the focus trap, SR
          // announcement, and analytics. They must not be consumer-
          // overridable — keep them AFTER the spread.
          // biome-ignore lint/a11y/useSemanticElements: Native dialog has default centering/backdrop incompatible with floating-ui
          role="dialog"
          aria-modal="true"
          aria-label={ariaLabel}
          data-tour-step={currentStep.id}
          data-tour-variant={variant}
        >
          <TourCardHeader
            title={resolvedTitle}
            titleId={`tour-step-title-${currentStep.id}`}
            showClose={showClose}
            stepIndicator={stepIndicator}
          />

          {currentStep.media && (
            <div className="px-4" data-slot="tour-card-media">
              <MediaSlot {...currentStep.media} />
            </div>
          )}

          <TourCardContent content={currentStep.content} description={resolvedDescription} />

          <TourCardFooter
            currentStep={currentStepIndex + 1}
            totalSteps={totalSteps}
            showNavigation={showNavigation}
            showProgress={showProgress}
            isFirstStep={isFirstStep}
            isLastStep={isLastStep}
            onPrev={prev}
            onNext={next}
            onSkip={skip}
          />

          {isRefreshed && <TourArrow ref={arrowRef} context={context} size={arrowSize} />}
        </div>
      </TourPortal>
    )
  }
)
TourCard.displayName = 'TourCard'
