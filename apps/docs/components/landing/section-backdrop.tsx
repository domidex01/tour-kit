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
 *
 * ## Where the numbers come from
 *
 * Do NOT derive these from `get_metadata`. For these layers its `x`/`y` are
 * not the rendered top-left — the nodes are rotated and mirrored, so reading
 * them as a position puts the art low and on the wrong side, which is exactly
 * the bug this file used to ship. `get_design_context` returns the resolved
 * box and transform instead, and that is what is encoded below.
 *
 * Both frames place an IDENTICAL art box and simply slide it up or down:
 *
 *   box     80.33% of the section wide (left copy at -42.32%, right copy at
 *           63.93%), a constant 1237px tall
 *   art     876 x 841 centred in that box, rotate(123.61deg) skewX(-3.43deg)
 *           — the left copy additionally scaleX(-1)
 *   bloom   an ellipse whose centre sits a constant 63px below the art box's
 *
 * So one number per section fixes everything: how far the art box's centre
 * sits below the section's top edge. In the two CTA frames the art rides NEAR
 * THE TOP, which is why the dense corner of each fan reads at the top of the
 * band and not under it; in the pricing frame it rides far lower, most of it
 * below the fold of its own section and bleeding down over the table.
 *
 * Because these are px from the host's top and NOT a share of its height, the
 * pricing row works even though its host in page.tsx wraps the pricing section
 * AND the ownership table in one `relative` div (the frames draw a single
 * backdrop across both). The wrapper's top is the pricing section's top, which
 * is all this offset is measured from — the extra height below only gives the
 * art more room to bleed into, exactly as the frame does.
 */
export type BackdropPlacement = 'band' | 'closing' | 'pricing'

/** Distance from the section's top edge to the centre of the art box. */
const ART_CENTRE_Y = {
  band: 232, // FreeCtaBand 3945:2048 — box top -60.88% of 635 = -386.6, + 618.35
  closing: 96, // ClosingCtaSection 3945:2749 — box top -90.41% of 578 = -522.6, + 618.35
  pricing: 852, // PricingSection 3945:2177 — box top 24.97% of 935 = 233.5, + 618.35
} as const

/** Constant across both frames. */
const BOX_HEIGHT = 1237
const BLOOM_DROP = 63

/**
 * The bloom is a FIXED-SIZE ellipse in the frames — the same 360.778 x 490.758
 * node in a 635px band and a 578px one — so its radii are px, never a share of
 * the section. Percentages made it taller in the taller section and, worse,
 * left it still bright where it met the section's edge.
 *
 * `BLOOM_BLEED` is why the layer is not `inset-0`. A gradient that is still
 * bright at the edge of its own box stops dead there, which drew a hard
 * horizontal seam across the page at every section boundary while the line art
 * carried on through. Painting it past the section lets it fade out on its own
 * terms, the way the frame's blurred ellipse does. 600 clears the furthest
 * reach of either placement (491 - 96 above, 295 + 491 below).
 */
const BLOOM_RX = 346
const BLOOM_RY = 491
const BLOOM_BLEED = 600

export function SectionBackdrop({
  placement = 'band',
}: {
  placement?: BackdropPlacement
}) {
  const centreY = ART_CENTRE_Y[placement]
  const box = { top: centreY - BOX_HEIGHT / 2, height: BOX_HEIGHT, width: '80.33%' }
  const bloomY = centreY + BLOOM_DROP + BLOOM_BLEED

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-x-clip">
      <div
        className="absolute right-0 left-0"
        style={{
          top: -BLOOM_BLEED,
          bottom: -BLOOM_BLEED,
          background: [
            `radial-gradient(ellipse ${BLOOM_RX}px ${BLOOM_RY}px at 0% ${bloomY}px, var(--tk-glow), transparent)`,
            `radial-gradient(ellipse ${BLOOM_RX}px ${BLOOM_RY}px at 100% ${bloomY}px, var(--tk-glow), transparent)`,
          ].join(','),
        }}
      />
      <div
        className="absolute flex items-center justify-center"
        style={{ ...box, left: '-42.32%' }}
      >
        <div
          className="h-[841px] w-[876px] -rotate-[123.61deg] -scale-x-100 skew-x-[-3.43deg] opacity-30"
          style={patternLayer}
        />
      </div>
      <div className="absolute flex items-center justify-center" style={{ ...box, left: '63.93%' }}>
        <div
          className="h-[841px] w-[876px] rotate-[123.61deg] skew-x-[-3.43deg] opacity-30"
          style={patternLayer}
        />
      </div>
    </div>
  )
}

const patternLayer = {
  background: 'var(--tk-primary-container)',
  maskImage: 'url(/hero-pattern.svg)',
  maskSize: '100% 100%',
  maskRepeat: 'no-repeat',
} as const
