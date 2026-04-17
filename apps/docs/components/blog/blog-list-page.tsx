import { BlogPagination } from '@/components/blog/pagination'
import { Footer } from '@/components/landing/footer'
import {
  getBlogCategories,
  getFeaturedBlogPosts,
  getPaginatedBlogPosts,
  getReadingTime,
} from '@/lib/blog'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import { ArrowRight, Rss, Star } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

function pageHref(page: number): string {
  return page === 1 ? '/blog' : `/blog/page/${page}`
}

interface BlogListPageProps {
  page: number
}

export function BlogListPage({ page }: BlogListPageProps) {
  const { posts, totalPages, currentPage } = getPaginatedBlogPosts(page)
  const categories = getBlogCategories()
  const featured = page === 1 ? getFeaturedBlogPosts() : []
  const prevPage = currentPage > 1 ? pageHref(currentPage - 1) : null
  const nextPage = currentPage < totalPages ? pageHref(currentPage + 1) : null

  return (
    <HomeLayout {...baseOptions()}>
      {prevPage && <link rel="prev" href={prevPage} />}
      {nextPage && <link rel="next" href={nextPage} />}
      <OrganizationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          ...(page > 1 ? [{ name: `Page ${page}`, url: `/blog/page/${page}` }] : []),
        ]}
      />

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-fd-border/50 dark:border-fd-border">
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32 lg:px-12">
          <h1 className="mb-2 text-3xl font-bold text-fd-foreground sm:text-4xl">Blog</h1>
          <p className="max-w-lg text-[15px] text-fd-muted-foreground">
            Guides, comparisons, and insights on product tours, onboarding, and developer
            experience.
          </p>
          <Link
            href="/blog/feed.xml"
            className="mt-3 inline-flex items-center gap-1.5 text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <Rss className="h-3.5 w-3.5" />
            RSS feed
          </Link>
        </div>
        <div
          className="pointer-events-none absolute inset-0 -z-0"
          style={{
            maskImage: 'linear-gradient(to bottom, white 40%, transparent)',
            WebkitMaskImage: 'linear-gradient(to bottom, white 40%, transparent)',
          }}
        >
          <img
            src="/blog-hero-light.png"
            alt=""
            className="h-full w-full object-cover opacity-60 dark:hidden"
          />
          <img
            src="/blog-hero-dark.png"
            alt=""
            className="hidden h-full w-full object-cover opacity-60 dark:block"
          />
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-8 lg:px-12">
        {/* Category filters */}
        <nav className="mb-8 flex flex-wrap gap-1.5" aria-label="Filter by category">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${encodeURIComponent(cat)}`}
              className="rounded-lg border border-fd-border/50 px-3 py-1.5 text-[12px] font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground dark:border-fd-border"
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Featured section — page 1 only */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[#0197f6]" />
              <h2 className="text-sm font-semibold text-fd-foreground">Featured</h2>
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((post) => (
                <FeaturedCard
                  key={post.slug}
                  slug={post.slug}
                  title={post.title}
                  description={post.description}
                  category={post.category}
                  image={post.ogImage}
                  readingTime={getReadingTime(post.slug)}
                />
              ))}
            </div>
          </section>
        )}

        {/* Card grid */}
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => (
            <BlogCard
              key={post.slug}
              slug={post.slug}
              title={post.title}
              description={post.description}
              category={post.category}
              image={post.ogImage}
              publishedAt={post.publishedAt}
              readingTime={getReadingTime(post.slug)}
            />
          ))}
        </div>

        <BlogPagination currentPage={currentPage} totalPages={totalPages} />
      </main>
      <Footer />
    </HomeLayout>
  )
}

function FeaturedCard({
  slug,
  title,
  description,
  category,
  image,
  readingTime,
}: {
  slug: string
  title: string
  description: string
  category: string
  image?: string
  readingTime?: string
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[#0197f6]/30 bg-gradient-to-b from-[#0197f6]/5 to-transparent p-4 transition-all hover:border-[#0197f6]/50 hover:shadow-md hover:shadow-[#0197f6]/5 dark:from-[#0197f6]/10"
    >
      <span className="mb-2 text-[11px] font-semibold text-[#0197f6]">{category}</span>
      {image && (
        <div className="relative mb-3 aspect-[1200/630] w-full overflow-hidden rounded-lg">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <span className="font-medium leading-snug text-fd-foreground">{title}</span>
      <span className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground line-clamp-2">
        {description}
      </span>
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-[#0197f6]">
        Read article
        <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
        {readingTime && (
          <span className="ml-1 font-normal text-fd-muted-foreground">· {readingTime}</span>
        )}
      </span>
    </Link>
  )
}

function BlogCard({
  slug,
  title,
  description,
  category,
  image,
  publishedAt,
  readingTime,
}: {
  slug: string
  title: string
  description: string
  category: string
  image?: string
  publishedAt?: string
  readingTime?: string
}) {
  const formattedDate = publishedAt
    ? new Date(publishedAt).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : null

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col rounded-2xl border border-fd-border/50 bg-fd-card p-4 shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground dark:border-fd-border"
    >
      <span className="mb-2 text-[11px] font-medium text-fd-muted-foreground group-hover:text-fd-accent-foreground/70">
        {category}
      </span>
      {image && (
        <div className="relative mb-3 aspect-[1200/630] w-full overflow-hidden rounded-lg">
          <Image
            src={image}
            alt={title}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
      )}
      <span className="font-medium leading-snug">{title}</span>
      <span className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground line-clamp-2 group-hover:text-fd-accent-foreground/70">
        {description}
      </span>
      <span className="mt-auto pt-4 text-xs text-[#0197f6]">
        {formattedDate}
        {formattedDate && readingTime && ' · '}
        {readingTime}
      </span>
    </Link>
  )
}
