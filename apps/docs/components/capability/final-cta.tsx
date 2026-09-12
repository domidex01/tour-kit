import type { CtaPlacement } from '@/components/analytics/tracked-cta-link'
import type { CapabilitySlug, SiblingCapability } from '@/components/capability/types'
import { ClosingCta } from '@/components/landing/closing-cta'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface FinalCtaProps {
  slug: CapabilitySlug
  heading: string
  headingAccent: string
  subtext: string
  /** Free pages show the install command beside the button. */
  installCmd?: string
  primaryLabel: string
  primaryHref: string
  /** "Pairs well with…" — 2 sibling capability pages, keeps visitors in the
      hub-and-spoke cluster when they don't convert. */
  siblings: SiblingCapability[]
}

/**
 * The capability pages' closing CTA: the shared `ClosingCta` (Figma 3945:2747)
 * plus the sibling cross-link band, which rides inside the same backdrop so
 * the two read as one closing block rather than two stacked sections.
 */
export function FinalCta({
  slug,
  heading,
  headingAccent,
  subtext,
  installCmd,
  primaryLabel,
  primaryHref,
  siblings,
}: FinalCtaProps) {
  const placement: CtaPlacement = `${slug}_footer`

  return (
    <ClosingCta
      heading={heading}
      headingAccent={headingAccent}
      subtext={subtext}
      installCmd={installCmd}
      ctaLabel={primaryLabel}
      ctaHref={primaryHref}
      placement={placement}
    >
      {/* Sibling cross-link band */}
      <div className="mt-6 w-full max-w-xl">
        <p className="mb-4 text-center font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-muted-foreground">
          Pairs well with
        </p>
        <div className="grid gap-3 text-left sm:grid-cols-2">
          {siblings.map((sibling) => (
            <Link
              key={sibling.href}
              href={sibling.href}
              className="group rounded-lg border border-[var(--tk-card-edge)] bg-fd-background/50 px-5 py-4 backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="flex items-center justify-between text-[14px] font-semibold text-fd-foreground">
                {sibling.label}
                <ArrowRight
                  className="h-3.5 w-3.5 text-[var(--color-fd-primary)] transition-transform group-hover:translate-x-0.5"
                  aria-hidden="true"
                />
              </span>
              <span className="mt-0.5 block text-[12.5px] text-fd-muted-foreground">
                {sibling.description}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </ClosingCta>
  )
}
