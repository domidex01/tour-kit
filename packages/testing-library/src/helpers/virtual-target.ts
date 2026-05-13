// Floating UI virtual-element pattern. Confirmed against /floating-ui/floating-ui
// docs (memory #180, 2026-05-12): refs.setReference({ getBoundingClientRect })
// is the supported way to position a floating element without a DOM target.

const DEFAULT_RECT: DOMRect = {
  x: 0,
  y: 0,
  width: 200,
  height: 100,
  top: 0,
  left: 0,
  right: 200,
  bottom: 100,
  toJSON() {
    return this
  },
}

export interface VirtualTarget {
  getBoundingClientRect: () => DOMRect
  contextElement?: Element
}

export function virtualTarget(
  rect: Partial<DOMRect> = {},
  contextElement?: Element
): VirtualTarget {
  const merged: DOMRect = { ...DEFAULT_RECT, ...rect }
  return {
    getBoundingClientRect: () => merged,
    ...(contextElement ? { contextElement } : {}),
  }
}
