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
 * The two blooms are anchored ON the section's edges, not inside them. A
 * horizontal sample across the CTA band in both frames ramps down from its
 * peak at x=0 to nothing by the middle, which a linear stop over a 20% radius
 * reproduces to within a couple of percent at every point measured.
 *
 * The host section must establish a stacking context (`relative`) — every
 * layer here is `-z-10` so page content stays above it.
 *
 * `overflow-x-clip`, never `overflow-hidden`: in the frames this art is taller
 * than its own section and bleeds into the bands above and below — the line
 * work in the top-right of DemoTabs is the hero's, and the corners under FAQ
 * are the closing CTA's. `hidden` would clip that away on both axes, and
 * `clip` is the one value that bounds x without coercing y into a scroll
 * container. Horizontal bleed is already caught by `html, body` in
 * globals.css.
 */
export function SectionBackdrop() {
  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-x-clip">
      <div
        className="absolute inset-0"
        style={{
          background: [
            'radial-gradient(ellipse 20% 70% at 0% 46%, var(--tk-glow), transparent)',
            'radial-gradient(ellipse 20% 70% at 100% 46%, var(--tk-glow), transparent)',
          ].join(','),
        }}
      />
      <div
        className="absolute top-[116%] right-full h-[1046px] w-[1067px] -translate-y-1/2 translate-x-1/2 rotate-[121.54deg] opacity-30"
        style={patternLayer}
      />
      <div
        className="absolute top-[116%] left-full h-[1046px] w-[1067px] -translate-x-1/2 -translate-y-1/2 -rotate-[121.54deg] opacity-30"
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
