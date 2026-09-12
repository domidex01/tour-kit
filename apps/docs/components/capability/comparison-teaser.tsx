import type { ComparisonTeaserRow } from '@/components/capability/types'
import { SectionHead } from '@/components/landing/section-head'
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
        className={`text-[13px] ${isTourKit ? 'font-semibold text-[var(--color-fd-primary)]' : 'text-emerald-600 dark:text-emerald-400'}`}
      >
        &#10003;
      </span>
    )
  }
  if (value === 'no') {
    return <span className="text-[13px] text-fd-muted-foreground/30">&mdash;</span>
  }
  if (value === 'partial') {
    return <span className="text-[13px] text-amber-600/70 dark:text-amber-400/70">~</span>
  }
  return (
    <span
      className={`text-[13px] ${isTourKit ? 'font-semibold text-[var(--color-fd-primary)]' : 'text-fd-muted-foreground'}`}
    >
      {value}
    </span>
  )
}

/** Compact 3-row excerpt of the home comparison table, linking to /compare. */
export function ComparisonTeaser({ heading, rows }: ComparisonTeaserProps) {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead size="section" title={heading} />

        {/* Table chrome measured off the one table the design does specify,
            the pricing frame's ComparisonTable (3880:1719): header cells on
            the card fill inside `--tk-card-edge` rules, body rows transparent
            over the page ground, and row rules a third lighter than the frame
            — rgb(22 28 47), which is the same slate-400 at 14% rather than the
            token's 20%. */}
        <div className="mt-12 overflow-x-auto">
          <table className="w-full min-w-[540px] table-fixed border-collapse">
            <thead>
              <tr className="border-y border-[var(--tk-card-edge)] bg-fd-card">
                <th className="w-[40%] px-6 py-3 text-left text-[13px] font-semibold text-fd-muted-foreground" />
                <th className="w-[20%] bg-[var(--color-fd-primary)]/5 px-5 py-3 text-center">
                  <span className="text-[13px] font-bold text-[var(--color-fd-primary)]">
                    userTourKit
                  </span>
                </th>
                <th className="w-[20%] px-5 py-3 text-center text-[13px] font-medium text-fd-muted-foreground">
                  SaaS platforms
                </th>
                <th className="w-[20%] px-5 py-3 text-center text-[13px] font-medium text-fd-muted-foreground">
                  OSS libraries
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[var(--tk-card-edge)]/70 transition-colors hover:bg-fd-muted/20"
                >
                  <td className="px-6 py-4 text-[14px] font-medium text-fd-foreground">
                    {row.label}
                  </td>
                  <td className="bg-[var(--color-fd-primary)]/5 px-5 py-4 text-center">
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
            className="text-[13px] font-semibold text-[var(--color-fd-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            Full comparison &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
