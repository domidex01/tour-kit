/**
 * The decorative band behind the CTA, pricing and closing sections (Figma
 * 3792:2046 / 2175 / 2747, and their dark twins). Each of those frames draws
 * the same four layers: a violet bloom at the left and right edges, and two
 * mirrored copies of the concentric line art bleeding in from the same two
 * edges.
 *
 * The art is the hero's `/hero-pattern.svg` again rather than a second export.
 * It is applied as a MASK, so only its alpha reaches the page and the tint is
 * a token — which is why one file serves both themes and all three sections,
 * and why flipping the theme costs no extra request.
 *
 * Figma reports the two pattern layers at x=-609 and x=2077, boxes that sit
 * well outside a 1440 frame, because those are pre-transform bounds: both are
 * rotated. The rotation and edge anchoring here reproduce what the frame
 * actually renders, and mirror the hero's own placement of the same asset.
 *
 * The host section must establish a stacking context (`relative`) — every
 * layer here is `-z-10` so page content stays above it.
 */
export function SectionBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 26% 62% at 2% 52%, var(--tk-glow), transparent 72%)',
            'radial-gradient(ellipse 26% 62% at 98% 52%, var(--tk-glow), transparent 72%)',
          ].join(','),
        }}
      />
      <div
        className="absolute top-1/2 right-full h-[1046px] w-[1067px] -translate-y-1/2 translate-x-1/2 rotate-[121.54deg] opacity-40"
        style={patternLayer}
      />
      <div
        className="absolute top-1/2 left-full h-[1046px] w-[1067px] -translate-x-1/2 -translate-y-1/2 -rotate-[121.54deg] opacity-40"
        style={patternLayer}
      />
    </div>
  )
}

const patternLayer = {
  background: 'var(--tk-primary-container)',
  maskImage: 'url(/hero-pattern.svg)',
  maskSize: '100% 100%',
  maskRepeat: 'no-repeat',
} as const
