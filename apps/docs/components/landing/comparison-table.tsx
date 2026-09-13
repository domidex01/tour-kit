import { SectionHead } from '@/components/landing/section-head'
import Link from 'next/link'

type Support = 'yes' | 'no' | 'partial' | string

const rows: { label: string; tourKit: Support; saas: Support; oss: Support }[] = [
  { label: 'Cost', tourKit: 'Free core', saas: '$200–900/mo', oss: 'Free' },
  {
    label: 'Bundle impact',
    tourKit: 'Under 4 KB per hook',
    saas: 'External script',
    oss: '30–50KB',
  },
  {
    label: 'Customization',
    tourKit: 'Your components',
    saas: 'Their UI + CSS overrides',
    oss: 'CSS overrides',
  },
  { label: 'Headless mode', tourKit: 'yes', saas: 'no', oss: 'no' },
  { label: 'TypeScript', tourKit: 'Strict native', saas: 'partial', oss: 'partial' },
  { label: 'Accessibility', tourKit: 'WCAG 2.1 AA', saas: 'partial', oss: 'no' },
  { label: 'Design system fit', tourKit: 'yes', saas: 'no', oss: 'partial' },
  { label: 'Self-hosted', tourKit: 'yes', saas: 'no', oss: 'yes' },
  { label: 'Data ownership', tourKit: 'yes', saas: 'no', oss: 'yes' },
]

function CellValue({ value, isTourKit = false }: { value: Support; isTourKit?: boolean }) {
  if (value === 'yes') {
    return (
      <span
        className={`text-[14px] ${isTourKit ? 'font-semibold text-[var(--color-fd-primary)]' : 'text-[var(--tk-success)]'}`}
      >
        &#10003;
      </span>
    )
  }
  if (value === 'no') {
    return <span className="text-[14px] text-fd-muted-foreground/40">&mdash;</span>
  }
  if (value === 'partial') {
    return <span className="text-[14px] text-amber-700 dark:text-amber-400">~</span>
  }
  return (
    <span
      className={`text-[14px] ${isTourKit ? 'font-semibold text-[var(--color-fd-primary)]' : 'text-fd-muted-foreground'}`}
    >
      {value}
    </span>
  )
}

export function ComparisonTable() {
  return (
    <section className="px-6 py-20 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead title="Stop renting your onboarding">
          SaaS platforms charge hundreds a month for UI you can&apos;t customize. Open-source
          alternatives ship bloated bundles without TypeScript or accessibility. userTourKit is the
          third option.
        </SectionHead>

        <div className="mt-12 max-w-[1059px] overflow-x-auto">
          <table className="w-full min-w-[540px] table-fixed border-collapse">
            <thead>
              <tr className="border-b border-[var(--tk-card-edge)]">
                <th className="w-[40%] py-3 pr-6 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-fd-muted-foreground" />
                <th className="w-[20%] bg-[var(--color-fd-primary)]/5 px-5 py-3 text-center">
                  <span className="text-[14px] font-bold text-[var(--color-fd-primary)]">
                    userTourKit
                  </span>
                </th>
                <th className="w-[20%] px-5 py-3 text-center text-[14px] text-fd-muted-foreground">
                  SaaS platforms
                </th>
                <th className="w-[20%] px-5 py-3 text-center text-[14px] text-fd-muted-foreground">
                  OSS libraries
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr
                  key={row.label}
                  className="border-b border-[var(--tk-card-edge)] transition-colors hover:bg-fd-muted/40"
                >
                  <td className="py-4 pr-6 text-[14px] font-medium text-fd-foreground">
                    {row.label}
                  </td>
                  <td className="bg-[var(--color-fd-primary)]/5 px-5 py-4 text-center">
                    <CellValue value={row.tourKit} isTourKit />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <CellValue value={row.saas} />
                  </td>
                  <td className="px-5 py-4 text-center">
                    <CellValue value={row.oss} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-6 max-w-[1059px]">
          <Link
            href="/compare"
            className="text-[14px] font-semibold text-[var(--color-fd-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See full comparison &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
