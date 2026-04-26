import { AUTHORS } from '@/lib/authors'
import { baseOptions } from '@/lib/layout.shared'
import {
  BreadcrumbJsonLd,
  DEFAULT_SPEAKABLE_SELECTORS,
  PersonJsonLd,
  SpeakableJsonLd,
} from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'

const TITLE = 'About userTourKit'
const DESCRIPTION =
  'userTourKit is an open-source headless product tour library for React, built by Dominique Degottex (domidex01). Three MIT-licensed core packages, plus an optional $99 Pro suite.'

const author = AUTHORS.domidex
const AUTHOR_BIO =
  'Dominique Degottex (domidex01) is a software engineer who builds open-source developer tools focused on accessible React components and product onboarding. He created userTourKit to ship a genuinely headless tour library that composes with shadcn/ui, Radix, and Base UI rather than fighting them. He maintains the eleven-package userTourKit monorepo (core, react, hints, adoption, analytics, announcements, checklists, media, scheduling, surveys, and AI integrations) and writes about onboarding architecture, schema/SEO, and headless component design on this site’s blog. Active in open source on GitHub at github.com/domidex01.'

export const metadata: Metadata = {
  title: `${TITLE} — userTourKit`,
  description: DESCRIPTION,
  alternates: { canonical: '/about' },
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: 'profile',
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

// Inline brand glyphs — lucide-react is deprecating brand icons.
function GithubIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function LinkedinIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.268 2.37 4.268 5.455v6.286ZM5.337 7.433a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124ZM7.119 20.452H3.554V9h3.565v11.452ZM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003Z" />
    </svg>
  )
}

function XIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      focusable="false"
    >
      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.786l-5.315-6.95L3.8 22H1.04l6.98-7.98L1 2h6.914l4.803 6.35L18.244 2Zm-2.382 18.188h1.882L7.204 3.708H5.21l10.652 16.48Z" />
    </svg>
  )
}

export default function AboutPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'About', url: '/about' },
        ]}
      />
      <SpeakableJsonLd url="/about" cssSelectors={[...DEFAULT_SPEAKABLE_SELECTORS]} />
      <PersonJsonLd
        name={author.name}
        legalName={author.legalName}
        url={author.url}
        jobTitle={author.jobTitle}
        image={author.avatar}
        description={AUTHOR_BIO}
        knowsAbout={author.knowsAbout}
        sameAs={[author.github, author.linkedin, author.x]}
      />
      <main
        id="main-content"
        className="mx-auto w-full max-w-[820px] px-6 py-16 sm:px-8 sm:py-20 lg:px-12"
      >
        <header className="mb-10">
          <h1
            data-speakable="headline"
            className="mb-4 text-3xl font-bold tracking-[-0.02em] text-fd-foreground sm:text-4xl"
          >
            {TITLE}
          </h1>
          <p
            data-speakable="summary"
            className="text-[16px] leading-relaxed text-fd-muted-foreground"
          >
            {DESCRIPTION}
          </p>
        </header>

        {/* Author card */}
        <section
          aria-labelledby="author-heading"
          className="mb-12 rounded-xl border border-fd-border bg-fd-card/40 p-6 sm:p-8"
        >
          <h2 id="author-heading" className="sr-only">
            About the author
          </h2>
          <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
            <Image
              src={author.avatar}
              alt={`${author.legalName ?? author.name} avatar`}
              width={88}
              height={88}
              className="h-20 w-20 shrink-0 rounded-full border border-fd-border"
              priority
            />
            <div className="flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <p className="text-[18px] font-semibold text-fd-foreground">{author.legalName}</p>
                <p className="text-[14px] text-fd-muted-foreground">({author.name})</p>
              </div>
              {author.jobTitle && (
                <p className="mt-0.5 text-[14px] text-fd-muted-foreground">
                  {author.jobTitle} · {author.role}
                </p>
              )}
              {author.knowsAbout && author.knowsAbout.length > 0 && (
                <ul className="mt-3 flex flex-wrap gap-1.5">
                  {author.knowsAbout.map((topic) => (
                    <li
                      key={topic}
                      className="rounded-full border border-fd-border bg-fd-muted/40 px-2.5 py-0.5 text-[12px] text-fd-muted-foreground"
                    >
                      {topic}
                    </li>
                  ))}
                </ul>
              )}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                <a
                  href={author.github}
                  target="_blank"
                  rel="noopener noreferrer me"
                  className="inline-flex items-center gap-1.5 text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                >
                  <GithubIcon className="h-3.5 w-3.5" />
                  <span>GitHub</span>
                </a>
                {author.linkedin && (
                  <a
                    href={author.linkedin}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-1.5 text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    <LinkedinIcon className="h-3.5 w-3.5" />
                    <span>LinkedIn</span>
                  </a>
                )}
                {author.x && (
                  <a
                    href={author.x}
                    target="_blank"
                    rel="noopener noreferrer me"
                    className="inline-flex items-center gap-1.5 text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    <XIcon className="h-3 w-3" />
                    <span>X</span>
                  </a>
                )}
              </div>
            </div>
          </div>
          <p className="mt-5 text-[14px] leading-relaxed text-fd-muted-foreground">{AUTHOR_BIO}</p>
        </section>

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
            <a href={author.github} target="_blank" rel="noopener noreferrer">
              {author.legalName ?? author.name}
            </a>
            , a software engineer focused on accessible onboarding and developer tooling.
            Development happens in the open at{' '}
            <a
              href="https://github.com/domidex01/tour-kit"
              target="_blank"
              rel="noopener noreferrer"
            >
              github.com/domidex01/tour-kit
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
              href="https://github.com/domidex01/tour-kit/issues"
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
