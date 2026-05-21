'use client'

import { type Placement, autoUpdate, flip, offset, shift, useFloating } from '@floating-ui/react'
import { cn } from '@tour-kit/core'
import type { VariantProps } from 'class-variance-authority'
import * as React from 'react'
import { createPortal } from 'react-dom'
import { useAnnouncement } from '../hooks/use-announcement'
import { useResolvedText } from '../lib/use-resolved-text'
import type { DismissalReason, SpotlightOptions } from '../types/announcement'
import { AnnouncementActions } from './announcement-actions'
import { AnnouncementClose } from './announcement-close'
import { AnnouncementContent } from './announcement-content'
import { spotlightContentVariants, spotlightOverlayVariants } from './ui/spotlight-variants'

export interface AnnouncementSpotlightProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'>,
    VariantProps<typeof spotlightContentVariants> {
  /** Announcement ID */
  id: string
  /** Whether the spotlight is visible (controlled) */
  open?: boolean
  /** Callback when visibility changes */
  onOpenChange?: (open: boolean) => void
  /** Spotlight options */
  options?: SpotlightOptions
  /** Content to render inside spotlight */
  children?: React.ReactNode
  /** Use config from provider */
  useConfig?: boolean
  /**
   * Visual variant.
   * - `'default'` (v4.0+) renders an inset-stroke cutout + directional arrow,
   *   passing WCAG 2.1 AA contrast on light backgrounds.
   * - `'legacy-spotlight'` keeps the v3.0 soft radial-gradient cutout for one
   *   minor cycle (until v4.1) so themes that rely on the legacy look can
   *   migrate without a hard break.
   */
  variant?: 'default' | 'legacy-spotlight'
  /**
   * Color of the inset stroke (and the directional arrow). `'auto'` resolves
   * to white on dark and `hsl(var(--primary))` on light via
   * `prefers-color-scheme`. Pass any CSS color string to override.
   * Ignored when `variant="legacy-spotlight"`.
   */
  strokeColor?: 'auto' | string
}

/**
 * SSR-safe resolver for `strokeColor='auto'`. Reads
 * `prefers-color-scheme: dark` via `useSyncExternalStore` so the component
 * re-renders if the user flips OS theme mid-session.
 */
function useResolvedStrokeColor(value: 'auto' | string | undefined): string {
  const prefersDark = React.useSyncExternalStore(
    React.useCallback((cb: () => void) => {
      if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
        return () => {
          /* no-op */
        }
      }
      const mq = window.matchMedia('(prefers-color-scheme: dark)')
      if (typeof mq.addEventListener === 'function') {
        mq.addEventListener('change', cb)
        return () => mq.removeEventListener('change', cb)
      }
      // Older jsdom / Safari fallback
      mq.addListener(cb)
      return () => mq.removeListener(cb)
    }, []),
    () =>
      typeof window !== 'undefined' && typeof window.matchMedia === 'function'
        ? window.matchMedia('(prefers-color-scheme: dark)').matches
        : false,
    () => false
  )
  if (typeof value === 'string' && value !== 'auto') return value
  return prefersDark ? '#ffffff' : 'hsl(var(--primary))'
}

const ARROW_ROTATION_BY_PLACEMENT: Record<'top' | 'right' | 'bottom' | 'left', number> = {
  top: 180,
  right: 270,
  bottom: 0,
  left: 90,
}

const ARROW_SIZE = 12
const ARROW_GAP = 6

/**
 * Compute the screen position of the decorative arrow given the target rect
 * and the placement chosen by Floating UI. The arrow sits between the cutout
 * edge and the content panel for the matching side.
 */
function computeArrowPosition(
  targetRect: DOMRect,
  placement: string,
  padding: number
): { top: number; left: number } {
  const arrowCenterX = targetRect.left + targetRect.width / 2
  const arrowCenterY = targetRect.top + targetRect.height / 2
  let arrowLeft = arrowCenterX - ARROW_SIZE / 2
  let arrowTop = arrowCenterY - ARROW_SIZE / 2

  if (placement === 'top') {
    arrowTop = targetRect.top - padding - ARROW_SIZE - ARROW_GAP
  } else if (placement === 'right') {
    arrowLeft = targetRect.right + padding + ARROW_GAP
  } else if (placement === 'bottom') {
    arrowTop = targetRect.bottom + padding + ARROW_GAP
  } else if (placement === 'left') {
    arrowLeft = targetRect.left - padding - ARROW_SIZE - ARROW_GAP
  }

  return { top: arrowTop, left: arrowLeft }
}

export const AnnouncementSpotlight = React.forwardRef<HTMLDivElement, AnnouncementSpotlightProps>(
  (
    {
      id,
      open: openProp,
      onOpenChange,
      placement: placementProp,
      options,
      className,
      children,
      useConfig = true,
      variant = 'default',
      strokeColor: strokeColorProp = 'auto',
      ...props
    },
    ref
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestrates target lookup, placement, variant branching, and dismiss/complete flows — extracting further would fragment the rendering contract
  ) => {
    const announcement = useAnnouncement(id)
    const config = announcement.config
    const [mounted, setMounted] = React.useState(false)
    const [targetElement, setTargetElement] = React.useState<Element | null>(null)

    const resolvedTitle = useResolvedText(config?.title)
    const resolvedDescription = useResolvedText(config?.description)
    const resolvedStrokeColor = useResolvedStrokeColor(strokeColorProp)

    // Controlled or uncontrolled open state
    const isControlled = openProp !== undefined
    const open = isControlled ? openProp : announcement.isVisible

    React.useEffect(() => {
      setMounted(true)
    }, [])

    const spotlightOptions: SpotlightOptions = {
      targetSelector: '',
      placement: 'bottom',
      offset: 8,
      showOverlay: true,
      overlayOpacity: 0.5,
      closeOnOverlayClick: true,
      ...options,
      ...config?.spotlightOptions,
    }

    const effectivePlacement = placementProp ?? spotlightOptions.placement ?? 'bottom'

    // Find target element
    React.useEffect(() => {
      if (!open || !spotlightOptions.targetSelector) {
        setTargetElement(null)
        return
      }

      const element = document.querySelector(spotlightOptions.targetSelector)
      setTargetElement(element)
    }, [open, spotlightOptions.targetSelector])

    const { refs, floatingStyles } = useFloating({
      placement: effectivePlacement as Placement,
      middleware: [offset(spotlightOptions.offset ?? 8), flip(), shift({ padding: 8 })],
      whileElementsMounted: autoUpdate,
    })

    // Set reference element when target is found
    React.useEffect(() => {
      if (targetElement) {
        refs.setReference(targetElement)
      }
    }, [targetElement, refs])

    const handleDismiss = React.useCallback(
      (reason: DismissalReason = 'close_button') => {
        announcement.dismiss(reason)
        onOpenChange?.(false)
      },
      [announcement, onOpenChange]
    )

    const handleComplete = React.useCallback(() => {
      announcement.complete()
      onOpenChange?.(false)
    }, [announcement, onOpenChange])

    if (!open || !mounted || !targetElement) return null

    const targetRect = targetElement.getBoundingClientRect()
    const padding = 4
    const isLegacy = variant === 'legacy-spotlight'

    // Legacy: soft radial-gradient cutout (v3.0 look)
    const legacyOverlayBg = `radial-gradient(circle at ${targetRect.left + targetRect.width / 2}px ${targetRect.top + targetRect.height / 2}px, transparent ${Math.max(targetRect.width, targetRect.height) / 2 + padding}px, rgba(0, 0, 0, ${spotlightOptions.overlayOpacity}) ${Math.max(targetRect.width, targetRect.height) / 2 + padding + 1}px)`

    // Default v4: dimmer overlay (full-screen, no cutout) + inset-stroke
    // bordered div positioned over the target. The dim layer is the same
    // radial gradient (consumers' expectations of a "highlighted" feature stay
    // intact); the new contract is the additional bordered cutout layer.
    const defaultOverlayBg = legacyOverlayBg

    // Position style for the 2px inset-stroke cutout. Sized to the target rect
    // plus padding; pointer-events disabled so clicks pass through to the
    // overlay button (or content beneath).
    const cutoutStyle: React.CSSProperties = {
      position: 'fixed',
      top: targetRect.top - padding,
      left: targetRect.left - padding,
      width: targetRect.width + padding * 2,
      height: targetRect.height + padding * 2,
      borderRadius: 8,
      pointerEvents: 'none',
      boxShadow: `inset 0 0 0 2px ${resolvedStrokeColor}`,
      zIndex: 41,
    }

    const arrowRotation =
      ARROW_ROTATION_BY_PLACEMENT[effectivePlacement as 'top' | 'right' | 'bottom' | 'left'] ?? 0
    const { top: arrowTop, left: arrowLeft } = computeArrowPosition(
      targetRect,
      effectivePlacement,
      padding
    )

    const arrowStyle: React.CSSProperties = {
      position: 'fixed',
      top: arrowTop,
      left: arrowLeft,
      width: ARROW_SIZE,
      height: ARROW_SIZE,
      transform: `rotate(${arrowRotation}deg)`,
      color: resolvedStrokeColor,
      pointerEvents: 'none',
      zIndex: 42,
    }

    const spotlightContent = (
      <>
        {/* Overlay with cutout — statically either an interactive <button> or
            an inert aria-hidden div so the element shape never mixes
            interactive ARIA on a non-interactive element. */}
        {spotlightOptions.showOverlay &&
          (spotlightOptions.closeOnOverlayClick ? (
            <button
              type="button"
              data-tk-spotlight-overlay
              data-variant={variant}
              className={cn(
                spotlightOverlayVariants({ visible: true }),
                'pointer-events-auto cursor-pointer border-0 p-0'
              )}
              style={{ background: isLegacy ? legacyOverlayBg : defaultOverlayBg }}
              onClick={() => handleDismiss('overlay_click')}
              aria-label="Close spotlight"
            />
          ) : (
            <div
              data-tk-spotlight-overlay
              data-variant={variant}
              className={cn(spotlightOverlayVariants({ visible: true }))}
              style={{ background: isLegacy ? legacyOverlayBg : defaultOverlayBg }}
              aria-hidden="true"
            />
          ))}

        {/* Inset-stroke cutout + directional arrow — default variant only.
            Skipped entirely when overlay is hidden so consumers who opt out
            of the dim layer don't get a stray bordered rectangle. */}
        {!isLegacy && spotlightOptions.showOverlay && (
          <>
            <div data-tk-spotlight-cutout aria-hidden="true" style={cutoutStyle} />
            <svg
              data-tk-spotlight-arrow
              aria-hidden="true"
              style={arrowStyle}
              viewBox="0 0 12 12"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path d="M6 0 L12 8 L0 8 Z" />
            </svg>
          </>
        )}

        {/* Spotlight content */}
        <div
          ref={(node) => {
            refs.setFloating(node)
            if (typeof ref === 'function') {
              ref(node)
            } else if (ref) {
              ref.current = node
            }
          }}
          data-state={open ? 'open' : 'closed'}
          data-variant={variant}
          className={cn(
            spotlightContentVariants({ placement: effectivePlacement, variant }),
            'pointer-events-auto',
            className
          )}
          style={floatingStyles}
          {...props}
        >
          <AnnouncementClose onClose={() => handleDismiss('close_button')} />

          {useConfig && config ? (
            <>
              <AnnouncementContent
                title={resolvedTitle}
                description={resolvedDescription}
                media={config.media}
              />
              <AnnouncementActions
                primaryAction={config.primaryAction}
                secondaryAction={config.secondaryAction}
                onAction={(type) => {
                  if (type === 'primary') {
                    handleComplete()
                  }
                }}
                onDismiss={() => handleDismiss('primary_action')}
              />
            </>
          ) : (
            children
          )}
        </div>
      </>
    )

    return createPortal(spotlightContent, document.body)
  }
)
AnnouncementSpotlight.displayName = 'AnnouncementSpotlight'
