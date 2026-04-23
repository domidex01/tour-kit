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

    const mergedProps = mergeProps(props, childProps)

    if (mergedRef) {
      mergedProps.ref = mergedRef
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
        ;(ref as React.RefObject<T | null>).current = value
      }
    }
  }
}

function mergeProps(
  slotProps: Record<string, unknown>,
  childProps: Record<string, unknown>
): Record<string, unknown> {
  // Child props override slot props by default, except for className (concat),
  // style (merge), and on* handlers (compose) — matches @radix-ui/react-slot.
  const overrideProps: Record<string, unknown> = { ...childProps }

  for (const propName in childProps) {
    const slotValue = slotProps[propName]
    const childValue = childProps[propName]
    const isHandler = /^on[A-Z]/.test(propName)

    if (isHandler) {
      if (typeof slotValue === 'function' && typeof childValue === 'function') {
        overrideProps[propName] = (...args: unknown[]) => {
          ;(childValue as (...a: unknown[]) => unknown)(...args)
          ;(slotValue as (...a: unknown[]) => unknown)(...args)
        }
      } else if (typeof slotValue === 'function') {
        overrideProps[propName] = slotValue
      }
    } else if (propName === 'style') {
      overrideProps[propName] = {
        ...(slotValue as React.CSSProperties | undefined),
        ...(childValue as React.CSSProperties | undefined),
      }
    } else if (propName === 'className') {
      overrideProps[propName] = [slotValue, childValue].filter(Boolean).join(' ')
    }
  }

  return { ...slotProps, ...overrideProps }
}
