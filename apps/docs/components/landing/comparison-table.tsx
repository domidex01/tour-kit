import Link from 'next/link'

type Support = 'yes' | 'no' | 'partial' | string

const rows: { label: string; tourKit: Support; saas: Support; oss: Support }[] = [
  { label: 'Cost', tourKit: 'Free core', saas: '$200–900/mo', oss: 'Free' },
  { label: 'Bundle impact', tourKit: '< 8KB', saas: 'External script', oss: '30–50KB' },
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

export function ComparisonTable() {
  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mb-12 max-w-lg">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Stop <span className="text-[#0197f6]">renting</span> your onboarding
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">
            SaaS platforms charge hundreds a month for UI you can&apos;t customize. Open-source
            alternatives ship bloated bundles without TypeScript or accessibility. userTourKit is
            the third option.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-[540px] border-collapse">
            <thead>
              <tr className="border-b border-fd-border">
                <th className="py-3 pr-6 text-left font-mono text-[11px] font-semibold uppercase tracking-[0.06em] text-fd-muted-foreground" />
                <th className="bg-[#0197f6]/5 px-5 py-3 text-center">
                  <span className="font-mono text-[13px] font-bold text-[#0197f6]">
                    userTourKit
                  </span>
                </th>
                <th className="px-5 py-3 text-center font-mono text-[12px] font-medium text-fd-muted-foreground">
                  SaaS platforms
                </th>
                <th className="px-5 py-3 text-center font-mono text-[12px] font-medium text-fd-muted-foreground">
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

        <div className="mt-6">
          <Link
            href="/docs/getting-started"
            className="font-mono text-[13px] font-semibold text-[#0197f6] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            See full comparison &rarr;
          </Link>
        </div>
      </div>
    </section>
  )
}
