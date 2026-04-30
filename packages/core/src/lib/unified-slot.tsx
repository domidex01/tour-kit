'use client'

import * as React from 'react'
import type { ReactElement, ReactNode } from 'react'

export type RenderProp = (props: Record<string, unknown>) => ReactElement

export interface UnifiedSlotProps {
  children: ReactNode | RenderProp
  [key: string]: unknown
}

/**
 * Unified Slot component that works with both Radix UI and Base UI.
 *
 * For Radix UI: clones element with merged props (className concat,
 * style merge, on* handler compose, ref merge).
 * For Base UI: calls `children` as a render prop with the merged props.
 *
 * Wrapped in `React.forwardRef` so the `ref` prop reaches this component
 * on both React 18 (where `ref` is stripped from `props` by createElement)
 * and React 19 (where it's a regular prop).
 */
export const UnifiedSlot = React.forwardRef<unknown, UnifiedSlotProps>(function UnifiedSlot(
  { children, ...props },
  ref
) {
  // Handle render prop pattern (Base UI style)
  if (typeof children === 'function') {
    const forwarded = ref ? { ...props, ref } : props
    return (children as RenderProp)(forwarded)
  }

  // Clone element with merged props (Radix UI style)
  if (React.isValidElement(children)) {
    const childProps = children.props as Record<string, unknown>
    // React 18 stores ref on element.ref; React 19 stores it in props.ref. Read both.
    const elementRef = (children as unknown as { ref?: React.Ref<unknown> }).ref
    const propsRef = (childProps as { ref?: React.Ref<unknown> }).ref
    const childRef = elementRef ?? propsRef
    const mergedRef = mergeRefs(ref ?? undefined, childRef)

    const mergedProps = mergeProps(props, childProps)

    // Only add ref if we have one to merge
    if (mergedRef) {
      mergedProps.ref = mergedRef
    }

    return React.cloneElement(children, mergedProps as Partial<unknown> & React.Attributes)
  }

  // Fallback: return empty fragment (should not happen with proper usage)
  return <>{children}</>
})

UnifiedSlot.displayName = 'UnifiedSlot'

/**
 * Merges multiple refs into a single ref callback
 */
function mergeRefs<T>(...refs: Array<React.Ref<T> | undefined>): React.RefCallback<T> | null {
  const validRefs = refs.filter((r): r is React.Ref<T> => r != null)
  if (validRefs.length === 0) return null
  return (value: T) => {
    for (const ref of validRefs) {
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
