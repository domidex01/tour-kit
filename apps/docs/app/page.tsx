import { ComparisonTable } from '@/components/landing/comparison-table'
import { DemoTour } from '@/components/landing/demo-tour'
import { Features } from '@/components/landing/features'
import { Footer } from '@/components/landing/footer'
import { Hero } from '@/components/landing/hero'
import { Packages } from '@/components/landing/packages'
import { QuickStart } from '@/components/landing/quick-start'
import { SocialProof } from '@/components/landing/social-proof'
import { baseOptions } from '@/lib/layout.shared'
import {
  OrganizationJsonLd,
  ProductJsonLd,
  SoftwareApplicationJsonLd,
  WebSiteJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

const HOMEPAGE_NAME = 'userTourKit'
const HOMEPAGE_DESCRIPTION =
  'Headless, accessible product tours, onboarding flows, and in-app messaging for React. Open-source core with optional Pro packages.'

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <SoftwareApplicationJsonLd name={HOMEPAGE_NAME} description={HOMEPAGE_DESCRIPTION} />
      <WebSiteJsonLd
        name={HOMEPAGE_NAME}
        description={HOMEPAGE_DESCRIPTION}
        searchUrl="https://usertourkit.com/search"
      />
      <OrganizationJsonLd />
      <ProductJsonLd />
      <main className="flex flex-1 flex-col">
        <Hero />
        <DemoTour />
        <QuickStart />
        <Features />
        <Packages />
        <ComparisonTable />
        <SocialProof />

        {/* CTA Footer */}
        <section className="relative overflow-hidden px-6 py-24 sm:px-8 md:py-32 lg:px-12">
          {/* Background images - same as hero */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            <img
              src="/tourkit-lighthouse.png"
              alt=""
              className="absolute inset-0 h-full w-full object-cover dark:hidden"
            />
            <img
              src="/hero-dark.avif"
              alt=""
              className="absolute inset-0 hidden h-full w-full object-cover opacity-50 dark:block"
            />
          </div>

          {/* Dot grid overlay */}
          <div
            className="pointer-events-none absolute inset-0 -z-10 opacity-[0.35]"
            style={{
              backgroundImage:
                'radial-gradient(circle, var(--color-fd-border) 1px, transparent 1px)',
              backgroundSize: '24px 24px',
            }}
          />

          <div className="relative mx-auto max-w-[1120px]">
            <div className="mx-auto max-w-xl rounded-2xl border border-fd-border/50 bg-fd-background/40 p-10 text-center shadow-2xl backdrop-blur-xl dark:bg-fd-background/40 sm:p-12">
              <h2 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-[#02182b] dark:text-white sm:text-4xl">
                Own your onboarding. <span className="text-[#0197f6]">Ship it today.</span>
              </h2>

              <p className="mb-10 text-[16px] text-fd-muted-foreground">
                No vendor lock-in. No monthly invoice. Just code you control and users who convert.
              </p>

              {/* Install command */}
              <div className="mx-auto mb-8 inline-flex items-center gap-3 rounded-lg border border-fd-border/50 bg-fd-muted/30 px-6 py-3 font-mono text-[14px] backdrop-blur-sm">
                <span className="select-none text-fd-muted-foreground/50">$</span>
                <span className="text-fd-foreground/70">pnpm add @tour-kit/react</span>
              </div>

              <div className="flex justify-center">
                <Link
                  href="/docs/getting-started"
                  className="group inline-flex items-center gap-2 rounded-lg bg-[#0197f6] px-7 py-3.5 text-[14px] font-semibold text-white shadow-lg shadow-[#0197f6]/20 transition-all hover:-translate-y-0.5 hover:brightness-110 hover:shadow-xl hover:shadow-[#0197f6]/30"
                >
                  Get started
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
            </div>
          </div>
        </section>
        <Footer />
      </main>
    </HomeLayout>
  )
}
