import type { PainOutcome } from '@/components/capability/types'
import { SectionBackdrop } from '@/components/landing/section-backdrop'
import { SectionHead } from '@/components/landing/section-head'
import { ArrowDown, CheckCircle2, XCircle } from 'lucide-react'

interface PainOutcomeStripProps {
  heading: string
  subtext: string
  items: PainOutcome[]
}

/**
 * Three status-quo pains (DIY, heavyweight suites) each mapped to the
 * outcome with userTourKit. Qualifies the visitor and mirrors the search
 * intent — lighter sibling of the home page's PainPoints section.
 *
 * This is the ONE body band on a capability page that carries a backdrop.
 * Scanning both edges of the dark frame (ToursHero's page, 3880:2605) finds
 * exactly four bloom bands down its 8613px: the hero's right-side wash, this
 * one centred at y≈2060, the CTA band at y≈4260 and the closing CTA at
 * y≈6260. The last two already draw their own, so this is the only addition —
 * and its peak measures a≈0.50, the same `--tk-glow` as the other two, which
 * is why it takes the default `band` placement rather than a new row.
 *
 * The muted band this section used to sit on is gone: between the cards the
 * frame measures rgb(2 6 24), the flat page ground, with only the bloom over
 * it.
 */
export function PainOutcomeStrip({ heading, subtext, items }: PainOutcomeStripProps) {
  return (
    <section className="relative px-6 py-36 sm:px-8 lg:px-12">
      <SectionBackdrop />

      <div className="relative mx-auto max-w-[1120px]">
        <SectionHead size="section" title={heading}>
          {subtext}
        </SectionHead>

        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.pain}
              className="flex flex-col rounded-xl border border-[var(--tk-card-edge)] bg-fd-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4">
                <p className="mb-1.5 flex items-start gap-2 text-[15px] font-semibold text-fd-foreground">
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fd-destructive)]"
                    aria-hidden="true"
                  />
                  {item.pain}
                </p>
                <p className="pl-6 text-[13.5px] leading-[1.6] text-fd-muted-foreground">
                  {item.painDetail}
                </p>
              </div>

              <ArrowDown
                className="mb-4 ml-1 h-4 w-4 text-fd-muted-foreground/40"
                aria-hidden="true"
              />

              {/* The inner card measures rgb(20 29 54) on the rgb(15 23 43)
                  card face — indigo-400 at 5%, which is what it already was. */}
              <div className="mt-auto rounded-lg border border-[var(--color-fd-primary)]/20 bg-[var(--color-fd-primary)]/5 p-4">
                <p className="mb-1.5 flex items-start gap-2 text-[15px] font-semibold text-fd-foreground">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-fd-primary)]"
                    aria-hidden="true"
                  />
                  {item.outcome}
                </p>
                <p className="pl-6 text-[13.5px] leading-[1.6] text-fd-muted-foreground">
                  {item.outcomeDetail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
