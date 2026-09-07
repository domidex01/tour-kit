/** jsdom returns all-zero rects for detached nodes, so pin values explicitly. */
export const rectOf = (top: number, left: number, width: number, height: number): DOMRect =>
  ({
    top,
    left,
    width,
    height,
    bottom: top + height,
    right: left + width,
    x: left,
    y: top,
    toJSON: () => ({}),
  }) as DOMRect
