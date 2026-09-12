import { SectionHead } from '@/components/landing/section-head'
import { highlightCode } from '@/components/landing/syntax-highlight'
import { CopyButton } from '@/components/ui/copy-button'
import { ArrowUpRight } from 'lucide-react'
import Link from 'next/link'
import { STUDIO_URL, type StudioTemplateId, studioTemplateHref } from './studio'

interface HowItWorksProps {
  /** The thing being built, lowercase ("checklist", "tour", "survey"). */
  thing: string
  packageName: string
  /** Studio starter template for this kind; omit when none exists (surveys). */
  studioTemplate?: StudioTemplateId
  /** Step-② compose snippet for the install-first flow. */
  composeCode: string
  composeFilename: string
  docsHref: string
}

interface Step {
  title: string
  description: string
  href?: string
  linkLabel?: string
  code?: string
  filename?: string
}

/**
 * "How it works — 3 steps." Two flavors, switched on NEXT_PUBLIC_STUDIO_URL
 * (see studio.ts): once the Studio ships this section becomes
 * Studio → `npx tourkit add` → own the code; until then it's the truthful
 * install → compose → ship flow. Collapses perceived effort either way.
 */
export function HowItWorks({
  thing,
  packageName,
  studioTemplate,
  composeCode,
  composeFilename,
  docsHref,
}: HowItWorksProps) {
  const studioHref = studioTemplateHref(studioTemplate)

  const steps: Step[] =
    STUDIO_URL && studioHref
      ? [
          {
            title: 'Design it in the Studio',
            description: `Build your ${thing} visually — no signup, no account. The template is pre-seeded; tweak copy and targets in the browser.`,
            href: studioHref,
            linkLabel: 'Open the Studio',
          },
          {
            title: 'Add it to your repo',
            description: 'One command pulls the recipe into your codebase as plain TypeScript.',
            code: 'npx tourkit add <recipe-id>',
            filename: 'terminal',
          },
          {
            title: 'Own the code',
            description: `The ${thing} lands in your repo as editable components — your design system, your version control, no embed script.`,
            href: docsHref,
            linkLabel: 'Read the docs',
          },
        ]
      : [
          {
            title: 'Install',
            description: 'One package, zero config.',
            code: `pnpm add ${packageName}`,
            filename: 'terminal',
          },
          {
            title: 'Compose',
            description: `Declarative config, headless or pre-styled — the ${thing} renders with your design system.`,
            code: composeCode,
            filename: composeFilename,
          },
          {
            title: 'Ship it',
            description: `The ${thing} lives in your bundle and your version control — no embed script, no vendor dashboard.`,
            href: docsHref,
            linkLabel: 'Read the docs',
          },
        ]

  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead align="end" size="section" title="Three steps to production">
          No iframe embeds, no script tags, no vendor dashboard. The code lands in your repo.
        </SectionHead>

        <ol className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step, i) => (
            <li
              key={step.title}
              className="flex flex-col rounded-xl border border-[var(--tk-card-edge)] bg-fd-card p-6"
            >
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[var(--tk-cta)] font-mono text-[13px] font-bold text-[var(--tk-cta-ink)]">
                  {i + 1}
                </span>
                <h3 className="text-[16px] font-bold text-fd-foreground">{step.title}</h3>
              </div>
              <p className="mb-5 text-[14px] leading-[1.6] text-fd-muted-foreground">
                {step.description}
              </p>

              {/* The panel's own chrome is one bar: sampled off the frame its
                  header is rgb(29 41 61) — slate-800, `fd-secondary` — and its
                  body is rgb(15 23 43), flush with the card face it sits on.
                  The three hardcoded near-blacks this used to ship predate the
                  token ramp and only worked inside a dark window. */}
              {step.code ? (
                <div className="mt-auto overflow-hidden rounded-lg border border-[var(--tk-card-edge)]">
                  <div className="flex items-center justify-between border-b border-[var(--tk-card-edge)] bg-fd-secondary px-3 py-2">
                    <span className="font-mono text-[11px] text-fd-muted-foreground">
                      {step.filename}
                    </span>
                    <CopyButton
                      text={step.code}
                      className="text-fd-muted-foreground/60 hover:text-fd-foreground"
                    />
                  </div>
                  <pre className="overflow-x-auto bg-fd-muted px-3 py-3 font-mono text-[12px] leading-[1.7]">
                    <code>{highlightCode(step.code)}</code>
                  </pre>
                </div>
              ) : null}

              {step.href ? (
                <Link
                  href={step.href}
                  className="mt-auto inline-flex items-center gap-1.5 font-mono text-[13px] font-semibold text-[var(--color-fd-primary)] transition-colors hover:opacity-80"
                >
                  {step.linkLabel}
                  <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
                </Link>
              ) : null}
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
