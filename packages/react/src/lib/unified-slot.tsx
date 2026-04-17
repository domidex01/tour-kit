'use client'

import * as React from 'react'
import type { ReactElement, ReactNode } from 'react'

export type RenderProp = (props: Record<string, unknown>) => ReactElement

export interface UnifiedSlotProps {
  children: ReactNode | RenderProp
  [key: string]: unknown
}

/**
 * Unified Slot component that works with both Radix UI and Base UI
 *
 * For Radix UI: Uses @radix-ui/react-slot
 * For Base UI: Clones element with merged props (similar behavior)
 *
 * This component provides a unified API for the `asChild` pattern,
 * allowing components to work with either Radix UI or Base UI.
 */
export function UnifiedSlot({ children, ...props }: UnifiedSlotProps): ReactElement {
  // Handle render prop pattern (Base UI style)
  if (typeof children === 'function') {
    return (children as RenderProp)(props)
  }

  // Clone element with merged props (Radix UI style)
  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>
    const propsRef = (props as { ref?: React.Ref<unknown> }).ref
    const childRef = (childProps as { ref?: React.Ref<unknown> }).ref
    const mergedRef = mergeRefs(propsRef, childRef)

    const mergedProps = {
      ...props,
      ...childProps,
    }

    // Only add ref if we have one to merge
    if (mergedRef) {
      ;(mergedProps as Record<string, unknown>).ref = mergedRef
    }

    return React.cloneElement(children, mergedProps as Partial<unknown> & React.Attributes)
  }

  // Fallback: return empty fragment (should not happen with proper usage)
  return <>{children}</>
}

/**
 * Merges multiple refs into a single ref callback
 */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> | null {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.RefObject<T | null>).current = value
      }
    }
  }
}
