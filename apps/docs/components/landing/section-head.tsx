import type { ReactNode } from 'react'

/**
 * The header every band on the home page shares (Figma 3792:1960 and its six
 * siblings): a bold title, a 16px gap, then 16/1.6 body on the same measure.
 *
 * There are exactly two sizes in the design. On the HOME frames it picks
 * between them by ALIGNMENT — every left- or right-aligned head is 48/50 on a
 * 512px measure, every centred one is 36/40 — and that stays the default.
 *
 * `size` breaks the two apart, because alignment only predicts the size on a
 * page whose H1 is the hero's. The capability frames (ToursHero's page,
 * 3880:2605) set EVERY body head at 36/40 whatever its alignment: measured off
 * the dark frame, the hero H1's glyph band is 45px and all six body heads are
 * 34px on a 40px baseline step, so they take the smaller step down from a
 * display H1 that is already 48px. Reading alignment as size there rendered
 * them a third too large and wrapped "Three steps to production" onto two
 * lines the frame keeps on one.
 *
 * Both ends of each clamp are the Figma value; the low end is what keeps a
 * 48px display line from overflowing a 375px viewport.
 *
 * Tracking is -0.72px on 48px, which is -0.015em, so one em-relative value
 * holds both sizes.
 */
type SectionHeadProps = {
  title: ReactNode
  /** The supporting line under the title. Omitted on heads that have none. */
  children?: ReactNode
  align?: 'start' | 'end' | 'center'
  /**
   * `display` is 48/50, `section` 36/40. Defaults to the home frames' rule —
   * centred heads are `section`, the rest `display`. Pass `section`
   * explicitly on a page whose H1 is not this section's, which on this site
   * means every capability page.
   */
  size?: 'display' | 'section'
  /**
   * Tailwind max-width for the measure. The design uses 512px for a left or
   * right head and 672px on Compare, where the copy runs four lines.
   */
  measure?: string
  className?: string
}

export function SectionHead({
  title,
  children,
  align = 'start',
  size,
  measure,
  className = '',
}: SectionHeadProps) {
  const centred = align === 'center'
  const box = centred ? 'mx-auto text-center' : align === 'end' ? 'ml-auto text-right' : ''
  const display = (size ?? (centred ? 'section' : 'display')) === 'display'

  return (
    <div
      className={`${measure ?? (centred ? 'max-w-[720px]' : 'max-w-[512px]')} ${box} ${className}`}
    >
      <h2
        className={
          display
            ? 'text-[clamp(2rem,4.4vw,3rem)] font-bold leading-[1.042] tracking-[-0.015em] text-fd-foreground'
            : 'text-[clamp(1.75rem,3.4vw,2.25rem)] font-bold leading-[1.111] tracking-[-0.015em] text-balance text-fd-foreground'
        }
      >
        {title}
      </h2>
      {children ? (
        <p className="mt-4 text-[16px] leading-[1.6] text-fd-muted-foreground">{children}</p>
      ) : null}
    </div>
  )
}
