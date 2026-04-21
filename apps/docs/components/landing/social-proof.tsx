import Link from 'next/link'

export function SocialProof() {
  return (
    <section className="border-y border-fd-border bg-[#EDF6FB] dark:bg-fd-muted/20 px-6 py-12 sm:px-8 lg:px-12">
      <div className="mx-auto flex max-w-[1120px] flex-wrap items-center justify-center gap-x-6 gap-y-3 font-mono text-[14px] text-fd-muted-foreground">
        <span>MIT Licensed</span>
        <span className="text-fd-muted-foreground/30">&middot;</span>
        <Link
          href="https://github.com/domidex01/tour-kit"
          className="text-fd-foreground underline underline-offset-4 transition-colors hover:text-[var(--landing-accent)]"
        >
          Star on GitHub
        </Link>
        <span className="text-fd-muted-foreground/30">&middot;</span>
        <span>100% TypeScript</span>
        <span className="text-fd-muted-foreground/30">&middot;</span>
        <Link
          href="https://github.com/domidex01/tour-kit/fork"
          className="text-fd-foreground underline underline-offset-4 transition-colors hover:text-[var(--landing-accent)]"
        >
          Contribute
        </Link>
        <span className="text-fd-muted-foreground/30">&middot;</span>
        <span>{'<'} 8KB gzipped</span>
      </div>
    </section>
  )
}
