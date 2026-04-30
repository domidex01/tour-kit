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
    const childRef = getElementRef(children)
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
 * Reads the ref off a ReactElement in a way that works for both React 18 and
 * React 19 *and* avoids the React 19 `element.ref` deprecation warning.
 *
 * - React 18: `ref` lives on `element.ref`; `element.props.ref` is a warning getter.
 * - React 19: `ref` lives on `element.props.ref`; `element.ref` is a warning getter.
 *
 * The runtime decides which side is the warning getter via `isReactWarning`,
 * mirroring the canonical pattern in `@radix-ui/react-slot`.
 */
function getElementRef(element: React.ReactElement): React.Ref<unknown> | undefined {
  const elementWithRef = element as unknown as { ref?: React.Ref<unknown> }
  const elementProps = (element.props ?? {}) as { ref?: React.Ref<unknown> }

  const propsGetter = Object.getOwnPropertyDescriptor(elementProps, 'ref')?.get as
    | (((this: unknown) => unknown) & { isReactWarning?: boolean })
    | undefined
  if (propsGetter?.isReactWarning) return elementWithRef.ref

  const elementGetter = Object.getOwnPropertyDescriptor(element, 'ref')?.get as
    | (((this: unknown) => unknown) & { isReactWarning?: boolean })
    | undefined
  if (elementGetter?.isReactWarning) return elementProps.ref

  return elementProps.ref ?? elementWithRef.ref
}

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
