import { TourKitLogo } from '@/lib/layout.shared'
import Link from 'next/link'

const footerLinks = {
  product: [
    { label: 'Documentation', href: '/docs' },
    { label: 'Getting started', href: '/docs/getting-started' },
    { label: 'API reference', href: '/docs/api' },
    { label: 'Examples', href: '/docs/examples' },
  ],
  packages: [
    { label: '@tour-kit/core', href: '/docs/core' },
    { label: '@tour-kit/react', href: '/docs/react' },
    { label: '@tour-kit/hints', href: '/docs/hints' },
    { label: '@tour-kit/analytics', href: '/docs/analytics' },
  ],
  community: [
    { label: 'GitHub', href: 'https://github.com/DomiDex/tour-kit' },
    { label: 'Changelog', href: 'https://github.com/DomiDex/tour-kit/releases' },
    {
      label: 'Contributing',
      href: 'https://github.com/DomiDex/tour-kit/blob/main/CONTRIBUTING.md',
    },
    { label: 'License', href: 'https://github.com/DomiDex/tour-kit/blob/main/LICENSE' },
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
              <TourKitLogo className="h-6 w-6 text-[#0197f6]" />
              <span className="text-[15px] font-semibold text-fd-foreground">TourKit</span>
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

          {/* Community */}
          <div>
            <h3 className="mb-4 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-fd-foreground">
              Community
            </h3>
            <ul className="space-y-2.5">
              {footerLinks.community.map((link) => (
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

        {/* Bottom bar */}
        <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-t border-fd-border pt-8">
          <p className="text-[12px] text-fd-muted-foreground">
            &copy; {new Date().getFullYear()} TourKit. MIT Licensed.
          </p>
          <div className="flex items-center gap-4">
            <Link
              href="https://github.com/DomiDex/tour-kit"
              className="text-fd-muted-foreground transition-colors hover:text-fd-foreground"
              aria-label="GitHub"
            >
              <svg
                className="h-4.5 w-4.5"
                viewBox="0 0 24 24"
                fill="currentColor"
                role="img"
                aria-label="GitHub"
              >
                <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
