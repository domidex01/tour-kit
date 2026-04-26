import { TourKitLogo } from '@/lib/layout.shared'
import Link from 'next/link'

const footerLinks = {
  product: [
    { label: 'Documentation', href: '/docs' },
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
    { label: '@tour-kit/analytics', href: '/docs/analytics' },
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
  machineReadable: [
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
    {
      label: 'RSS feed',
      href: '/blog/feed.xml',
      title: 'Blog RSS feed',
    },
  ],
}

export function Footer() {
  return (
    <footer className="border-t border-fd-border px-6 py-16 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="grid gap-12 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div>
            <Link href="/" className="mb-4 inline-flex items-center gap-2">
              <TourKitLogo className="h-8 w-8 text-[#0197f6]" />
              <span className="text-[15px] font-semibold text-fd-foreground">userTourKit</span>
            </Link>
            <p className="mt-3 max-w-[240px] text-[13px] leading-[1.6] text-fd-muted-foreground">
              The open-source onboarding toolkit for React. Headless, accessible, and tiny.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-foreground">
              Product
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.product.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Packages */}
          <div>
            <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-foreground">
              Packages
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.packages.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="font-mono text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-foreground">
              Company
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.company.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Machine-readable resources */}
        <ul className="mt-10 flex flex-wrap gap-x-5 gap-y-2 border-t border-fd-border pt-6">
          {footerLinks.machineReadable.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                title={link.title}
                className="font-mono text-[12px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        {/* Bottom bar */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-t border-fd-border pt-6">
          <p className="text-[12px] text-fd-muted-foreground">
            &copy; {new Date().getFullYear()} userTourKit. MIT Licensed.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/domidex01/tour-kit"
              className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              aria-label="userTourKit on GitHub"
            >
              <svg
                className="h-4.5 w-4.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </Link>
            <Link
              href="https://www.npmjs.com/package/@tour-kit/core"
              className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              aria-label="userTourKit on npm"
            >
              <svg
                className="h-4.5 w-4.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M0 0v24h24V0Zm19.35 19.35h-2.4v-9.6h-4.8v9.6H2.4V4.65h16.95Z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
