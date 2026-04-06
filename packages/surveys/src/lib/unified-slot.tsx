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
 */
export function UnifiedSlot({ children, ...props }: UnifiedSlotProps): ReactElement {
  if (typeof children === 'function') {
    return (children as RenderProp)(props)
  }

  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>
    const propsRef = (props as { ref?: React.Ref<unknown> }).ref
    const childRef = (childProps as { ref?: React.Ref<unknown> }).ref
    const mergedRef = mergeRefs(propsRef, childRef)

    const mergedProps = {
      ...props,
      ...childProps,
    }

    if (mergedRef) {
      ;(mergedProps as Record<string, unknown>).ref = mergedRef
    }

    return React.cloneElement(children, mergedProps as Partial<unknown> & React.Attributes)
  }

  return <>{children}</>
}

function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> | null {
  return (value: T) => {
    for (const ref of refs) {
      if (typeof ref === 'function') {
        ref(value)
      } else if (ref != null) {
        ;(ref as React.MutableRefObject<T | null>).current = value
      }
    }
  }
}
