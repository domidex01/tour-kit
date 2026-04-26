import Link from 'next/link'

const TRUST_CHIPS = [
  '< 8KB core gzipped',
  'WCAG 2.1 AA',
  'Lighthouse a11y 100',
  'TypeScript strict',
  '>80% test coverage',
  'MIT core',
  'React 19 ready',
  'shadcn-native',
]

export function SocialProof() {
  return (
    <section className="border-y border-fd-border bg-[#EDF6FB] dark:bg-fd-muted/20 px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px] text-center">
        <p className="mb-3 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[#0197f6]">
          The honest pitch
        </p>
        <h2 className="mb-4 text-2xl font-bold tracking-[-0.01em] text-fd-foreground sm:text-3xl">
          Why pick a fresh library?
        </h2>
        <p className="mx-auto mb-8 max-w-2xl text-[15px] leading-[1.6] text-fd-muted-foreground">
          Tour Kit is new — no legacy API debt, no corporate-UX baggage, no AGPL contamination.
          Built headless-first so you bring your own components and styles. Every chip below is a
          measured technical fact, not a marketing claim.
        </p>
        <ul className="mx-auto flex max-w-[900px] flex-wrap items-center justify-center gap-2">
          {TRUST_CHIPS.map((chip) => (
            <li
              key={chip}
              className="rounded-full border border-fd-border bg-fd-card px-3.5 py-1.5 font-mono text-[12px] font-medium text-fd-foreground"
            >
              {chip}
            </li>
          ))}
        </ul>
        <p className="mt-8 text-[13px] text-fd-muted-foreground">
          See the{' '}
          <Link
            href="/docs"
            className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            documentation
          </Link>{' '}
          or{' '}
          <Link
            href="https://github.com/domidex01/tour-kit"
            className="text-fd-foreground underline decoration-dotted underline-offset-4 hover:decoration-solid"
          >
            source on GitHub
          </Link>
          .
        </p>
      </div>
    </section>
  )
}
