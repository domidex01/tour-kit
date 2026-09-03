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
  isVisibleStep,
  logger,
  resolveTarget,
  useFocusTrap,
  useKeyboardNavigation,
  useReducedMotion,
  useTour,
} from '@tour-kit/core'
import { cn } from '@tour-kit/core'
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

// Lazy-load the media stack: @tour-kit/media is only fetched when a step
// actually declares `media`, so tour consumers without media steps never ship
// it in their initial bundle (bundlers split the dynamic import into its own
// async chunk). Deliberately NO `webpackIgnore`/`@vite-ignore` magic comments
// here — those would leave a bare specifier the browser cannot resolve at
// runtime, breaking media for every bundled consumer. Step media is required
// UX (unlike the analytics/Lottie optional-SDK pattern), so the import must
// stay bundler-resolvable.
const LazyMediaSlot = React.lazy(() =>
  import('@tour-kit/media').then((mod) => ({ default: mod.MediaSlot }))
)

export interface TourCardProps
  extends Omit<React.ComponentPropsWithoutRef<'div'>, 'content'>,
    TourCardVariants {
  /** Show "N / M" indicator inside the header. Default: true on `variant="refreshed"`, false on `variant="classic"`. */
  showStepIndicator?: boolean
  /** Floating UI arrow size in pixels. Default: 8. */
  arrowSize?: number
  /**
   * Dismiss the tour when the user presses Escape (standard dialog
   * convention). Default: `true`. Only Escape is wired here — for full
   * keyboard navigation (arrows/Enter) use `useKeyboardNavigation`.
   */
  closeOnEscape?: boolean
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
  (
    {
      className,
      size,
      variant = 'refreshed',
      showStepIndicator,
      arrowSize,
      closeOnEscape = true,
      ...props
    },
    ref
  ) => {
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

    // Phase 3 (refactor train) — TourStep is now a discriminated union;
    // hidden steps don't render UI so we narrow to the visible branch here
    // and bail out below. The provider already skips hidden steps on advance,
    // so this is a defensive narrow for typing rather than a runtime gate.
    const visibleStep = currentStep && isVisibleStep(currentStep) ? currentStep : null

    // A step is truly "modal" only when it does NOT opt into spotlight
    // interaction. Interactive steps intentionally let keyboard/pointer users
    // reach the highlighted target (e.g. branching tours), so we must not trap
    // focus, claim `aria-modal`, or inert the background for them.
    const isModal = isActive && visibleStep !== null && !visibleStep.interactive

    const arrowRef = React.useRef<SVGSVGElement>(null)
    const reducedMotion = useReducedMotion()
    const { containerRef, activate, deactivate } = useFocusTrap(isModal, {
      inertBackground: true,
    })

    // Esc-to-dismiss (standard dialog convention). Wires only Escape — empty
    // next/prev key lists leave arrow/Enter navigation to consumers who opt
    // into `useKeyboardNavigation` themselves. The hook no-ops when the tour
    // is inactive and ignores keypresses while typing in form fields.
    useKeyboardNavigation({
      enabled: closeOnEscape,
      nextKeys: [],
      prevKeys: [],
      exitKeys: ['Escape'],
    })

    // TourPortal mounts its node lazily (after its own mount effect), so the
    // card div is not in the DOM on the first render where the tour activates.
    // Track the mounted node in state so the focus-trap effect re-runs once the
    // node exists — otherwise activate() bails on a null container and the trap
    // never engages (and the focused element is never captured for restore).
    const [cardNode, setCardNode] = React.useState<HTMLDivElement | null>(null)

    const targetElement = React.useMemo(() => {
      if (!visibleStep?.target) return null
      return resolveTarget(visibleStep.target)
    }, [visibleStep?.target])

    const { refs, floatingStyles, context } = useFloating({
      open: isActive,
      placement: toFloatingPlacement(visibleStep?.placement),
      middleware: [
        offset(visibleStep?.offset?.[1] ?? 12),
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
      if (isModal && cardNode) {
        activate()
        return () => deactivate()
      }
    }, [isModal, cardNode, activate, deactivate])

    // Emit deprecation warning once per step id when classic variant is in use.
    React.useEffect(() => {
      if (variant !== 'classic' || !visibleStep?.id) return
      if (process.env.NODE_ENV === 'production') return
      if (warnedClassicStepIds.has(visibleStep.id)) return
      warnedClassicStepIds.add(visibleStep.id)
      logger.warn(
        'react: <TourCard variant="classic"> is deprecated and will be removed in the next major. See https://usertourkit.com/docs/react/components/tour-card-migration'
      )
    }, [variant, visibleStep?.id])

    const resolvedTitle = useResolvedText(visibleStep?.title)
    const resolvedDescription = useResolvedText(visibleStep?.description)

    if (!isActive || !visibleStep) return null

    const showNavigation = visibleStep.showNavigation ?? true
    const showClose = visibleStep.showClose ?? true
    const showProgress = visibleStep.showProgress ?? true

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
            // Track the mounted node so the focus-trap effect re-runs once the
            // portal child exists (see cardNode note above).
            setCardNode(node)
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
            visibleStep.className,
            className
          )}
          {...props}
          // The dialog contract (role / aria-modal / aria-label) and the
          // tour data attributes are load-bearing for the focus trap, SR
          // announcement, and analytics. They must not be consumer-
          // overridable — keep them AFTER the spread.
          // biome-ignore lint/a11y/useSemanticElements: Native dialog has default centering/backdrop incompatible with floating-ui
          role="dialog"
          // Only claim modal semantics when the step is actually modal. For
          // interactive steps the background stays reachable by design, so
          // `aria-modal` is omitted (non-modal dialog) and focus is not trapped.
          aria-modal={isModal ? 'true' : undefined}
          aria-label={ariaLabel}
          data-tour-step={visibleStep.id}
          data-tour-variant={variant}
        >
          <TourCardHeader
            title={resolvedTitle}
            titleId={`tour-step-title-${visibleStep.id}`}
            showClose={showClose}
            stepIndicator={stepIndicator}
          />

          {visibleStep.media && (
            <div className="px-4" data-slot="tour-card-media">
              <React.Suspense fallback={null}>
                <LazyMediaSlot {...visibleStep.media} />
              </React.Suspense>
            </div>
          )}

          {/* `TourNode` is a React-free supertype of `ReactNode`, so nothing
              assigns back without a cast. Same boundary-cast convention as
              `@tour-kit/core`'s `lib/schemas/parse.ts`: cast once, here. */}
          <TourCardContent
            content={visibleStep.content as React.ReactNode}
            description={resolvedDescription}
          />

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
