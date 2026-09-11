import type { ReactNode } from 'react'

/**
 * The header every band on the home page shares (Figma 3792:1960 and its six
 * siblings): a bold title, a 16px gap, then 16/1.6 body on the same measure.
 *
 * There are exactly two sizes in the design and it picks between them by
 * ALIGNMENT, not by a prop of its own — every left- or right-aligned head is
 * 48/50 on a 512px measure, every centred one is 36/40. Both ends of each
 * clamp are the Figma value; the low end is what keeps a 48px display line
 * from overflowing a 375px viewport.
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
  measure,
  className = '',
}: SectionHeadProps) {
  const centred = align === 'center'
  const box = centred ? 'mx-auto text-center' : align === 'end' ? 'ml-auto text-right' : ''

  return (
    <div
      className={`${measure ?? (centred ? 'max-w-[720px]' : 'max-w-[512px]')} ${box} ${className}`}
    >
      <h2
        className={
          centred
            ? 'text-[clamp(1.75rem,3.4vw,2.25rem)] font-bold leading-[1.111] tracking-[-0.015em] text-balance text-fd-foreground'
            : 'text-[clamp(2rem,4.4vw,3rem)] font-bold leading-[1.042] tracking-[-0.015em] text-fd-foreground'
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
