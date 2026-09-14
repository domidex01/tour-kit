import { DiscordIcon, NpmIcon, TourKitLogo } from '@/lib/layout.shared'
import Link from 'next/link'

/**
 * Site footer — Figma 3945:2766 (Home · Dark) / 3792:x (Home · Light).
 *
 * Four 244px columns on a 1120px container, a rule-bound copyright bar, and a
 * oversized gradient wordmark that bleeds past the container as a watermark.
 * The brand column the old footer opened with is gone: the wordmark carries the
 * brand now, and its slot became the INFORMATION column.
 */

interface FooterLink {
  label: string
  href: string
  /** Tooltip for the machine-readable endpoints, whose names are opaque. */
  title?: string
}

const footerLinks: Record<string, FooterLink[]> = {
  product: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Studio (visual builder)', href: '/builder' },
    { label: 'Live demo', href: '/demo' },
    { label: 'Getting started', href: '/docs/getting-started' },
    { label: 'Compare', href: '/compare' },
    { label: 'Benchmarks', href: '/benchmarks' },
    { label: 'Blog', href: '/blog' },
    { label: 'Pricing', href: '/pricing' },
    { label: 'Manage license', href: '/account' },
  ],
  packages: [
    { label: '@tour-kit/core', href: '/docs/core' },
    { label: '@tour-kit/react', href: '/docs/react' },
    { label: '@tour-kit/hints', href: '/docs/hints' },
    { label: '@tour-kit/adoption', href: '/docs/adoption' },
    { label: '@tour-kit/ai', href: '/docs/ai' },
    { label: '@tour-kit/analytics', href: '/docs/analytics' },
    { label: '@tour-kit/announcements', href: '/docs/announcements' },
    { label: '@tour-kit/checklists', href: '/docs/checklists' },
    { label: '@tour-kit/media', href: '/docs/media' },
    { label: '@tour-kit/scheduling', href: '/docs/scheduling' },
    { label: '@tour-kit/surveys', href: '/docs/surveys' },
  ],
  company: [
    { label: 'About', href: '/about' },
    { label: 'Editorial policy', href: '/editorial-policy' },
    { label: 'How we test', href: '/how-we-test' },
    { label: 'Privacy', href: '/legal/privacy' },
    { label: 'Terms', href: '/legal/terms' },
    { label: 'Contact', href: 'https://github.com/domidex01/tour-kit/issues/new' },
    { label: 'Changelog', href: 'https://github.com/domidex01/tour-kit/releases' },
    {
      label: 'Contributing',
      href: 'https://github.com/domidex01/tour-kit/blob/main/CONTRIBUTING.md',
    },
    { label: 'License', href: 'https://github.com/domidex01/tour-kit/blob/main/LICENSE' },
    { label: 'Site map', href: '/sitemap' },
  ],
  information: [
    {
      label: 'llms.txt',
      href: '/llms.txt',
      title: 'Concise site summary for AI assistants (llmstxt.org spec)',
    },
    {
      label: 'llms-full.txt',
      href: '/llms-full.txt',
      title: 'Full documentation corpus for AI ingestion',
    },
    {
      label: 'sitemap.xml',
      href: '/sitemap.xml',
      title: 'Machine-readable sitemap for search engines',
    },
    { label: 'RSS feed', href: '/blog/feed.xml', title: 'Blog RSS feed' },
  ],
}

const socials = [
  {
    label: 'userTourKit on GitHub',
    href: 'https://github.com/domidex01/tour-kit',
    icon: GitHubIcon,
  },
  {
    label: 'userTourKit on Discord',
    href: 'https://discord.com/channels/1515937013277265930/1515937474659225630',
    icon: DiscordIcon,
  },
  {
    label: 'userTourKit on npm',
    href: 'https://www.npmjs.com/package/@tour-kit/core',
    icon: NpmIcon,
  },
]

function GitHubIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  )
}

function FooterColumn({ heading, links }: { heading: string; links: FooterLink[] }) {
  return (
    <div>
      <h3 className="text-[11px] font-bold uppercase tracking-[0.08em] text-fd-foreground">
        {heading}
      </h3>
      <ul className="mt-[15px]">
        {links.map((link) => (
          <li key={link.href} className="flex h-6 items-center">
            <Link
              href={link.href}
              title={link.title}
              className="text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}

export function Footer() {
  return (
    <footer className="overflow-hidden px-6 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px] pt-16">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          <FooterColumn heading="Product" links={footerLinks.product} />
          <FooterColumn heading="Packages" links={footerLinks.packages} />
          <FooterColumn heading="Company" links={footerLinks.company} />

          <div>
            <FooterColumn heading="Information" links={footerLinks.information} />
            <ul className="mt-[15px] flex items-center gap-4">
              {socials.map(({ label, href, icon: Icon }) => (
                <li key={href}>
                  <Link
                    href={href}
                    aria-label={label}
                    className="block text-fd-muted-foreground transition-colors hover:text-fd-primary"
                  >
                    <Icon className="h-6 w-6" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-wrap items-center justify-between gap-4 border-y border-[var(--tk-hairline)] py-6">
          <p className="text-[12px] text-fd-muted-foreground">
            &copy; {new Date().getFullYear()} userTourKit. Source-available under BSL 1.1, free in
            development, a licence key in production.
          </p>
        </div>
      </div>

      {/*
        Decorative wordmark. It is deliberately wider than the container and
        bleeds off both edges, so it is aria-hidden — the brand is already in
        the navbar and the copyright line, and the lower half of the gradient
        sits below AA on purpose.
      */}
      <div
        aria-hidden="true"
        className="pointer-events-none mt-10 flex select-none items-center justify-center gap-[3.5vw]"
      >
        {/*
          ponytail: the design fills the lighthouse with the same vertical
          gradient as the text. background-clip only paints text, so the mark
          takes the gradient's top colour instead of the ramp. Upgrade path is
          an SVG <linearGradient> inside TourKitLogo, which would cost the
          navbar's currentColor tinting.
        */}
        <TourKitLogo className="h-[24vw] max-h-[344px] w-auto shrink-0 text-indigo-300" />
        <span
          className="bg-gradient-to-b from-indigo-300 from-[14%] to-slate-500/50 to-[112%] bg-clip-text font-semibold leading-[1.45] text-transparent"
          style={{ fontSize: 'clamp(3rem, 14.6vw, 210px)' }}
        >
          userTourKit
        </span>
      </div>
    </footer>
  )
}
