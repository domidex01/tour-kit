import { Footer } from '@/components/landing/footer'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ChevronRight } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'

interface BreadcrumbItem {
  label: string
  href: string
}

interface ArticleLayoutProps {
  children: ReactNode
  breadcrumbs: BreadcrumbItem[]
  title: string
  description: string
  lastUpdated?: string
  relatedLinks?: { label: string; href: string }[]
}

export function ArticleLayout({
  children,
  breadcrumbs,
  title,
  description,
  lastUpdated,
  relatedLinks,
}: ArticleLayoutProps) {
  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd items={breadcrumbs.map((b) => ({ name: b.label, url: b.href }))} />
      <main className="mx-auto w-full max-w-[860px] px-6 py-12 sm:px-8 lg:px-12">
        {/* Breadcrumbs */}
        <nav aria-label="Breadcrumb" className="mb-8">
          <ol className="flex flex-wrap items-center gap-1 text-[13px] text-fd-muted-foreground">
            {breadcrumbs.map((crumb, i) => (
              <li key={crumb.href} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="h-3 w-3" />}
                {i === breadcrumbs.length - 1 ? (
                  <span className="text-fd-foreground">{crumb.label}</span>
                ) : (
                  <Link href={crumb.href} className="transition-colors hover:text-fd-foreground">
                    {crumb.label}
                  </Link>
                )}
              </li>
            ))}
          </ol>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            {title}
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">{description}</p>
          {lastUpdated && (
            <p className="mt-3 text-[13px] text-fd-muted-foreground">Last updated: {lastUpdated}</p>
          )}
        </header>

        {/* Article Body */}
        <article className="prose prose-neutral dark:prose-invert max-w-none [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-fd-border [&_th]:bg-fd-muted/50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-[13px] [&_th]:font-semibold [&_td]:border [&_td]:border-fd-border [&_td]:px-4 [&_td]:py-2 [&_td]:text-[14px]">
          {children}
        </article>

        {/* Related Links */}
        {relatedLinks && relatedLinks.length > 0 && (
          <aside className="mt-16 border-t border-fd-border pt-8">
            <h2 className="mb-4 text-lg font-semibold text-fd-foreground">Related comparisons</h2>
            <ul className="space-y-2">
              {relatedLinks.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-[14px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </aside>
        )}
      </main>
      <Footer />
    </HomeLayout>
  )
}
