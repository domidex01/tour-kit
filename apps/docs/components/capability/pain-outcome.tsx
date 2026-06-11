import type { PainOutcome } from '@/components/capability/types'
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
 */
export function PainOutcomeStrip({ heading, subtext, items }: PainOutcomeStripProps) {
  return (
    <section className="bg-[#EDF6FB] px-6 py-20 sm:px-8 md:py-28 lg:px-12 dark:bg-fd-muted/30">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-14 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {heading}
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">{subtext}</p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.pain}
              className="flex flex-col rounded-xl border border-fd-border bg-fd-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-4">
                <p className="mb-1.5 flex items-start gap-2 text-[15px] font-semibold text-fd-foreground">
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-rose-500/80"
                    aria-hidden="true"
                  />
                  {item.pain}
                </p>
                <p className="pl-6 text-[13.5px] leading-relaxed text-fd-muted-foreground">
                  {item.painDetail}
                </p>
              </div>

              <ArrowDown
                className="mb-4 ml-1 h-4 w-4 text-fd-muted-foreground/40"
                aria-hidden="true"
              />

              <div className="mt-auto rounded-lg border border-[#0197f6]/20 bg-[#0197f6]/5 p-4">
                <p className="mb-1.5 flex items-start gap-2 text-[15px] font-semibold text-fd-foreground">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-[#0197f6]"
                    aria-hidden="true"
                  />
                  {item.outcome}
                </p>
                <p className="pl-6 text-[13.5px] leading-relaxed text-fd-muted-foreground">
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
