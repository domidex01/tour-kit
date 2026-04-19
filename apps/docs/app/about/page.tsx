import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

const TITLE = 'About userTourKit'
const DESCRIPTION =
  'userTourKit is an open-source headless product tour library for React, built by DomiDex. Three MIT-licensed core packages, plus an optional $99 Pro suite.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'website',
    url: '/about',
    images: [`/api/og?title=${encodeURIComponent('About')}&category=ABOUT`],
  },
  twitter: {
    card: 'summary_large_image',
    title: TITLE,
    description: DESCRIPTION,
    images: [`/api/og?title=${encodeURIComponent('About')}&category=ABOUT`],
  },
}

export default function AboutPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main
        id="main-content"
        className="mx-auto w-full max-w-[820px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1 className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {TITLE}
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">{DESCRIPTION}</p>
        </header>

        <article className="prose prose-neutral dark:prose-invert max-w-none">
          <h2>Why it exists</h2>
          <p>
            Most product-tour libraries ship their own UI runtime, often 30–60 KB gzipped, and force
            you into their opinionated styling. userTourKit takes the opposite approach: all tour
            logic lives in hooks and headless primitives, so you compose the UI with the components
            you already ship — shadcn/ui, Radix, Base UI, or your own.
          </p>

          <h2>Who maintains it</h2>
          <p>
            userTourKit is maintained by{' '}
            <a href="https://github.com/DomiDex" target="_blank" rel="noopener noreferrer">
              DomiDex
            </a>
            , a React developer focused on accessible onboarding and developer tooling. Development
            happens in the open at{' '}
            <a
              href="https://github.com/DomiDex/tour-kit"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/DomiDex/tour-kit
            </a>
            .
          </p>

          <h2>How it's licensed</h2>
          <p>
            The core library (<code>@tour-kit/core</code>), React bindings (
            <code>@tour-kit/react</code>), and hints package (<code>@tour-kit/hints</code>) are
            MIT-licensed and free for any use — commercial or otherwise. The extended Pro packages
            (analytics, checklists, adoption, media, scheduling, announcements, AI, surveys) are
            sold as a one-time commercial license. See <Link href="/pricing">pricing</Link>.
          </p>

          <h2>How to get in touch</h2>
          <p>
            For bugs, feature requests, and general questions, please use{' '}
            <a
              href="https://github.com/DomiDex/tour-kit/issues"
              target="_blank"
              rel="noopener noreferrer"
            >
              GitHub Issues
            </a>
            . For Pro license support, include your order ID.
          </p>
        </article>
      </main>
    </HomeLayout>
  )
}
