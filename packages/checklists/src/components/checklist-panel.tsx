'use client'

import { cn, useResolveLocalizedText, useUILibrary } from '@tour-kit/core'
import * as React from 'react'
import { useChecklist } from '../hooks/use-checklist'
import { Slot, UnifiedSlot } from '../lib/slot'
import { Checklist } from './checklist'
import { ChecklistProgress } from './checklist-progress'
import {
  type ChecklistPanelVariants,
  checklistPanelVariants,
  panelChevronVariants,
  panelContentVariants,
  panelHeaderVariants,
} from './ui/panel-variants'

export interface ChecklistPanelProps
  extends React.ComponentPropsWithoutRef<'div'>,
    ChecklistPanelVariants {
  /** Checklist ID */
  checklistId: string
  /** Default expanded state */
  defaultExpanded?: boolean
  /** Collapsible header */
  collapsible?: boolean
  /** Use as child element */
  asChild?: boolean
}

/**
 * Expandable/collapsible checklist panel
 * Follows shadcn/ui patterns with CVA variants
 *
 * @example
 * ```tsx
 * <ChecklistPanel checklistId="onboarding" collapsible defaultExpanded />
 * ```
 *
 * @example
 * ```tsx
 * <ChecklistPanel checklistId="onboarding" size="lg" asChild>
 *   <section>...</section>
 * </ChecklistPanel>
 * ```
 */
export const ChecklistPanel = React.forwardRef<HTMLDivElement, ChecklistPanelProps>(
  (
    {
      checklistId,
      defaultExpanded = true,
      className,
      size,
      collapsible = true,
      asChild = false,
      ...props
    },
    ref
  ) => {
    const library = useUILibrary()
    const resolveText = useResolveLocalizedText()
    const {
      checklist,
      progress,
      isDismissed,
      isComplete,
      isExpanded,
      toggleExpanded,
      setExpanded,
    } = useChecklist(checklistId)

    // Set initial expanded state — only on first mount.
    // useLayoutEffect runs before paint, so `defaultExpanded={false}` doesn't
    // flash as expanded for a frame before collapsing.
    const initializedRef = React.useRef(false)
    React.useLayoutEffect(() => {
      if (initializedRef.current) return
      initializedRef.current = true
      setExpanded(defaultExpanded)
    }, [defaultExpanded, setExpanded])

    if (!checklist || isDismissed) return null
    if (isComplete && checklist.config.hideOnComplete) return null

    const Comp = asChild ? (library === 'base-ui' ? UnifiedSlot : Slot) : 'div'

    return (
      <Comp ref={ref} className={cn(checklistPanelVariants({ size }), className)} {...props}>
        {/* Collapsible Header */}
        <button
          type="button"
          onClick={collapsible ? toggleExpanded : undefined}
          className={panelHeaderVariants({ collapsible })}
          aria-expanded={isExpanded}
          disabled={!collapsible}
        >
          <div className="flex items-center gap-3">
            {checklist.config.icon && <div className="text-primary">{checklist.config.icon}</div>}
            <div className="text-left">
              {/* biome-ignore lint/a11y/useSemanticElements: <h3> is invalid inside <button>; span with heading role keeps SR semantics without invalid HTML */}
              <span role="heading" aria-level={3} className="font-semibold block">
                {resolveText(checklist.config.title)}
              </span>
              <p className="text-sm text-muted-foreground">
                {progress.completed} of {progress.total} complete
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Mini progress */}
            <div className="w-16">
              <ChecklistProgress value={progress.completed} max={progress.total} />
            </div>

            {/* Chevron */}
            {collapsible && (
              <svg
                className={panelChevronVariants({ expanded: isExpanded })}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            )}
          </div>
        </button>

        {/* Content */}
        <div className={panelContentVariants({ expanded: isExpanded })}>
          <div className="border-t">
            <Checklist
              checklistId={checklistId}
              showHeader={false}
              showProgress={false}
              showDismiss={false}
            />
          </div>
        </div>
      </Comp>
    )
  }
)
ChecklistPanel.displayName = 'ChecklistPanel'
