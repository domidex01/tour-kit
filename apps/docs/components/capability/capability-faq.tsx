'use client'

import type { CapabilityFaqItem } from '@/components/capability/types'
import { useState } from 'react'

interface CapabilityFaqProps {
  /** Unique per page — namespaces the disclosure element ids. */
  idPrefix: string
  heading: string
  subtext: string
  /** Same items feed FAQJsonLd on the server side — single source of truth. */
  items: CapabilityFaqItem[]
}

/**
 * Accessible FAQ accordion — same disclosure pattern as the home FAQ
 * (aria-expanded/aria-controls, focus-visible ring), parameterized per
 * capability page. Written from real long-tails for FAQPage SERP real estate.
 */
export function CapabilityFaq({ idPrefix, heading, subtext, items }: CapabilityFaqProps) {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  return (
    <section className="px-6 py-20 sm:px-8 md:py-28 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="mx-auto mb-12 max-w-lg text-center">
          <h2 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {heading}
          </h2>
          <p className="text-[16px] leading-[1.6] text-fd-muted-foreground">{subtext}</p>
        </div>

        <div className="mx-auto max-w-3xl divide-y divide-fd-border overflow-hidden rounded-xl border border-fd-border bg-fd-card">
          {items.map((item, i) => {
            const isOpen = openIndex === i
            const panelId = `${idPrefix}-faq-panel-${i}`
            const triggerId = `${idPrefix}-faq-trigger-${i}`
            return (
              <div key={item.question}>
                <button
                  type="button"
                  id={triggerId}
                  aria-expanded={isOpen}
                  aria-controls={panelId}
                  onClick={() => setOpenIndex(isOpen ? null : i)}
                  className="flex w-full cursor-pointer items-center justify-between gap-4 px-6 py-4 text-left text-[15px] font-semibold text-fd-foreground transition-colors hover:bg-fd-muted/50 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-[var(--tk-primary)]"
                >
                  {item.question}
                  <svg
                    className={`h-4 w-4 shrink-0 text-fd-muted-foreground transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="m6 9 6 6 6-6" />
                  </svg>
                </button>
                <section
                  id={panelId}
                  aria-labelledby={triggerId}
                  hidden={!isOpen}
                  className={`grid transition-all duration-200 ${isOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}
                >
                  <div className="overflow-hidden">
                    <p className="px-6 pb-5 text-[14px] leading-relaxed text-fd-muted-foreground">
                      {item.answer}
                    </p>
                  </div>
                </section>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
