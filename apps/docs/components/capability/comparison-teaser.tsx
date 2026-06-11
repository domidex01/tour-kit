import type { ComparisonTeaserRow } from '@/components/capability/types'
import Link from 'next/link'

interface ComparisonTeaserProps {
  heading: string
  /** 3 capability-focused rows. Never competitor names in headings —
      /compare and /alternatives own the competitor cluster. */
  rows: ComparisonTeaserRow[]
}

function Cell({ value, isTourKit = false }: { value: string; isTourKit?: boolean }) {
  if (value === 'yes') {
    return (
      <span
        className={`font-mono text-[13px] ${isTourKit ? 'font-semibold text-[#0197f6]' : 'text-emerald-600 dark:text-emerald-400'}`}
      >
        &#10003;
      </span>
    )
  }
  if (value === 'no') {
    return <span className="font-mono text-[13px] text-fd-muted-foreground/30">&mdash;</span>
  }
  if (value === 'partial') {
    return <span className="font-mono text-[13px] text-amber-600/70 dark:text-amber-400/70">~</span>
  }
  return (
    <span
      className={`font-mono text-[13px] ${isTourKit ? 'font-semibold text-[#0197f6]' : 'text-fd-muted-foreground'}`}
    >
      {value}
    </span>
  )
}

/** Compact 3-row excerpt of the home comparison table, linking to /compare. */
export function ComparisonTeaser({ heading, rows }: ComparisonTeaserProps) {
  return (
    <section className="px-6 py-16 sm:px-8 md:py-24 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-10 max-w-lg">
          <h2 className="mb-2 text-2xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-3xl">
            {heading}
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-fd-border">
                <th className="w-[40%] py-3 pr-6 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-fd-muted-foreground" />
                <th className="w-[20%] bg-[#0197f6]/5 px-5 py-3 text-center">
                  <span className="font-mono text-[13px] font-bold text-[#0197f6]">
                    userTourKit
                  </span>
                </th>
                <th className="w-[20%] px-5 py-3 text-center font-mono text-[12px] font-medium text-fd-muted-foreground">
                  SaaS platforms
                </th>
                <th className="w-[20%] px-5 py-3 text-center font-mono text-[12px] font-medium text-fd-muted-foreground">
                  OSS libraries
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-fd-border/50 transition-colors hover:bg-fd-muted/20"
                >
                  <td className="py-4 pr-6 text-[14px] font-medium text-fd-foreground">
                    {row.label}
                  </td>
                  <td className="bg-[#0197f6]/5 px-5 py-4 text-center">
                    <Cell value={row.tourKit} isTourKit />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Cell value={row.saas} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <Cell value={row.oss} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6">
          <Link
            href="/compare"
            className="font-mono text-[13px] font-semibold text-[#0197f6] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            Full comparison &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
