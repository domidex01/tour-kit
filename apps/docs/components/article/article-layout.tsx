import { ShareButtons } from '@/components/blog/share-buttons'
import { Footer } from '@/components/landing/footer'
import type { Author } from '@/lib/authors'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ChevronRight } from 'lucide-react'
import Image from 'next/image'
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
  publishedAt?: string
  readingTime?: string
  shareUrl?: string
  author?: Author
  toc?: ReactNode
  relatedLinks?: { label: string; href: string }[]
}

export function ArticleLayout({
  children,
  breadcrumbs,
  title,
  description,
  lastUpdated,
  publishedAt,
  readingTime,
  shareUrl,
  author,
  toc,
  relatedLinks,
}: ArticleLayoutProps) {
  const formattedPublished = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      })
    : null
  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd items={breadcrumbs.map((b) => ({ name: b.label, url: b.href }))} />
      <main
        id="main-content"
        className={`mx-auto w-full px-6 py-12 sm:px-8 lg:px-12 ${toc ? 'max-w-[1100px]' : 'max-w-[860px]'}`}
      >
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
          <div className="mt-4 flex flex-wrap items-center justify-between gap-y-3">
            <div className="flex items-center gap-3">
              {author && (
                <a
                  href={author.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex shrink-0 items-center gap-2.5"
                >
                  <Image
                    src={author.avatar}
                    alt={author.name}
                    width={32}
                    height={32}
                    className="rounded-full"
                  />
                  <div className="flex flex-col">
                    <span className="text-[13px] font-medium text-fd-foreground">
                      {author.name}
                    </span>
                    <span className="text-[11px] text-fd-muted-foreground">{author.role}</span>
                  </div>
                </a>
              )}
              {author && (formattedPublished || readingTime) && (
                <span className="text-fd-border" aria-hidden="true">
                  |
                </span>
              )}
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[13px] text-fd-muted-foreground">
                {formattedPublished && <span>{formattedPublished}</span>}
                {readingTime && (
                  <>
                    {formattedPublished && <span aria-hidden="true">·</span>}
                    <span>{readingTime}</span>
                  </>
                )}
                {lastUpdated && lastUpdated !== publishedAt && (
                  <>
                    <span aria-hidden="true">·</span>
                    <span>Updated {lastUpdated}</span>
                  </>
                )}
              </div>
            </div>
            {shareUrl && <ShareButtons url={shareUrl} title={title} />}
          </div>
        </header>

        {/* Article Body + Sidebar TOC */}
        <div className={toc ? 'xl:grid xl:grid-cols-[1fr_220px] xl:gap-10' : ''}>
          <article className="prose prose-neutral dark:prose-invert min-w-0 max-w-none [&_h2]:mt-12 [&_h2]:mb-4 [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:tracking-tight [&_h3]:mt-8 [&_h3]:mb-3 [&_h3]:text-xl [&_h3]:font-semibold [&_table]:w-full [&_table]:border-collapse [&_th]:border [&_th]:border-fd-border [&_th]:bg-fd-muted/50 [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:text-[13px] [&_th]:font-semibold [&_td]:border [&_td]:border-fd-border [&_td]:px-4 [&_td]:py-2 [&_td]:text-[14px]">
            {children}
          </article>

          {/* Desktop sticky TOC sidebar */}
          {toc && (
            <aside className="hidden xl:block">
              <div className="sticky top-20">{toc}</div>
            </aside>
          )}
        </div>

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
