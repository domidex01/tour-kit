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
 * The three CTA/pricing frames place an IDENTICAL art box and simply slide it
 * up or down:
 *
 *   box     80.33% of the section wide (left copy at -42.32%, right copy at
 *           63.93%), a constant 1237px tall
 *   art     876 x 841 centred in that box, rotate(123.61deg) skewX(-3.43deg)
 *           — the left copy additionally scaleX(-1)
 *   bloom   an ellipse whose centre sits a constant 63px below the art box's
 *
 * So one number per section fixes those three: how far the art box's centre
 * sits below the section's top edge. In the two CTA frames the art rides NEAR
 * THE TOP, which is why the dense corner of each fan reads at the top of the
 * band and not under it; in the pricing frame it rides far lower, most of it
 * below the fold of its own section and bleeding down over the table.
 *
 * The `hero` placement is the one that is NOT that box — see HERO_ART. It is
 * the only geometry here measured off a section whose height varies between
 * callers (385px on /pricing, 439px on /blog) and it does not move between
 * them, which is why every offset in this file is px from the host's top
 * rather than a share of its height.
 *
 * Because these are px from the host's top and NOT a share of its height, the
 * pricing row works even though its host in page.tsx wraps the pricing section
 * AND the ownership table in one `relative` div (the frames draw a single
 * backdrop across both). The wrapper's top is the pricing section's top, which
 * is all this offset is measured from — the extra height below only gives the
 * art more room to bleed into, exactly as the frame does.
 */
export type BackdropPlacement = 'band' | 'closing' | 'pricing' | 'hero'

/**
 * There are exactly TWO art geometries in the design, not one per section.
 *
 * The CTA/pricing bands draw a large, shallow-angled fan; the page-hero band
 * that opens /pricing and /blog (PricingHero 3880:1529, BlogHero 3880:2109 —
 * byte-identical backdrop nodes in both, which is how we know the band is
 * fixed and does NOT scale with its section's height) draws a smaller one,
 * turned further and centred on the frame's own vertical edges.
 *
 * Everything else — the -3.43deg skew, the mirrored left copy, the mask, the
 * bloom — is shared, so a placement is a geometry plus two offsets.
 */
const CTA_ART = {
  boxWidth: '80.33%',
  boxHeight: 1237,
  left: '-42.32%',
  right: '63.93%',
  artW: 876,
  artH: 841,
  angle: 123.61,
} as const

/** Hero band: 945.8 x 997.3 box, 711 x 683 art, centred on each frame edge. */
const HERO_ART = {
  boxWidth: '65.68%',
  boxHeight: 997,
  left: '-34.24%',
  right: '67.84%',
  artW: 711,
  artH: 683,
  angle: 142.81,
} as const

/**
 * `artCentreY` is the distance from the section's top edge to the centre of
 * the art box; `bloomY` the same for the edge blooms. The CTA rows keep the
 * one constant 63px drop they have always had — the hero band measures 54.
 */
const PLACEMENTS = {
  // FreeCtaBand 3945:2048 — box top -60.88% of 635 = -386.6, + 618.35
  band: { art: CTA_ART, artCentreY: 232, bloomY: 295 },
  // ClosingCtaSection 3945:2749 — box top -90.41% of 578 = -522.6, + 618.35
  closing: { art: CTA_ART, artCentreY: 96, bloomY: 159 },
  // PricingSection 3945:2177 — box top 24.97% of 935 = 233.5, + 618.35
  pricing: { art: CTA_ART, artCentreY: 852, bloomY: 915 },
  // PricingHero 3880:1529 — art box centre 260.7, bloom ellipse centre 314.9
  hero: { art: HERO_ART, artCentreY: 261, bloomY: 315 },
} as const satisfies Record<BackdropPlacement, unknown>

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
  const { art, artCentreY, bloomY: bloomCentreY } = PLACEMENTS[placement]
  const box = {
    top: artCentreY - art.boxHeight / 2,
    height: art.boxHeight,
    width: art.boxWidth,
  }
  const bloomY = bloomCentreY + BLOOM_BLEED
  const leaf = { height: art.artH, width: art.artW, ...patternLayer }

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
      {/* The angle differs per geometry, so the transform is inline rather
          than a Tailwind arbitrary class — those have to be static strings. */}
      <div className="absolute flex items-center justify-center" style={{ ...box, left: art.left }}>
        <div
          className="opacity-30"
          style={{ ...leaf, transform: `rotate(${-art.angle}deg) scaleX(-1) skewX(-3.43deg)` }}
        />
      </div>
      <div
        className="absolute flex items-center justify-center"
        style={{ ...box, left: art.right }}
      >
        <div
          className="opacity-30"
          style={{ ...leaf, transform: `rotate(${art.angle}deg) skewX(-3.43deg)` }}
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
