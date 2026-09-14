import type { CapabilityFeature } from '@/components/capability/types'
import { SectionHead } from '@/components/landing/section-head'

interface CapabilityFeaturesProps {
  heading: string
  subtext: string
  /**
   * Six cards: 3 shared pillars (headless, WCAG, code-ownership) + 3
   * kind-specific. Supporting packages (media, scheduling, analytics,
   * adoption) appear here as `packageBadge` rows instead of getting their
   * own thin pages.
   */
  items: CapabilityFeature[]
}

export function CapabilityFeatures({ heading, subtext, items }: CapabilityFeaturesProps) {
  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <SectionHead size="section" title={heading}>
          {subtext}
        </SectionHead>

        <div className="mt-14 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((feature) => (
            <div
              key={feature.title}
              className="rounded-lg border border-[var(--tk-card-edge)] bg-fd-card p-6 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <div className="mb-3 flex items-start justify-between gap-3">
                <h3 className="text-[15px] font-bold text-fd-foreground">{feature.title}</h3>
                {feature.packageBadge ? (
                  <span className="shrink-0 rounded border border-[var(--tk-card-edge)] bg-fd-secondary px-2 py-0.5 font-mono text-[10px] text-fd-muted-foreground">
                    {feature.packageBadge}
                  </span>
                ) : null}
              </div>
              <p className="text-[14px] leading-[1.6] text-fd-muted-foreground">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
