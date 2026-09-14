import { BlogCta } from '@/components/blog/blog-cta'
import { BlogPagination } from '@/components/blog/pagination'
import { Footer } from '@/components/landing/footer'
import { PageHero } from '@/components/landing/page-hero'
import {
  getBlogCategories,
  getFeaturedBlogPosts,
  getPaginatedBlogPosts,
  getReadingTime,
  slugifyCategory,
} from '@/lib/blog'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, ItemListJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
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
      <ItemListJsonLd
        name={page === 1 ? 'userTourKit blog' : `userTourKit blog, page ${page}`}
        url={pageHref(page)}
        items={posts.map((post) => ({
          url: `/blog/${post.slug}`,
          name: post.title.replace(/["']/g, ''),
        }))}
      />

      <PageHero
        heading="Blog"
        footer={
          <Link
            href="/blog/feed.xml"
            className="inline-flex items-center gap-1.5 text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            <Rss className="h-3.5 w-3.5" aria-hidden="true" />
            RSS feed
          </Link>
        }
      >
        {/* Two intros, not one: the frame draws a single paragraph, but the
            short one keeps the first post cards above the fold on a phone.
            Spans rather than <p>s — PageHero already wraps this in one. */}
        <span className="sm:hidden">
          Tutorials, comparisons, and field notes on React product tours and onboarding. New
          articles weekly.
        </span>
        <span className="hidden sm:inline">
          Practical writing on product tours, user onboarding, feature adoption, and developer-led
          growth. Every post is engineered for the people who actually ship the code: tutorials with
          copy-pasteable React snippets, head-to-head comparisons against tools like React Joyride,
          Shepherd.js, Driver.js, Appcues, and Pendo, build-vs-buy breakdowns, accessibility
          deep-dives, and field notes from teams running production onboarding flows. New articles
          ship weekly. Skim by category below or subscribe to the RSS feed for everything as it
          drops.
        </span>
      </PageHero>

      <main id="main-content" className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-8 lg:px-12">
        {/* Category filters — centred under the band, as the frame draws them. */}
        <nav className="mb-10 flex flex-wrap justify-center gap-2" aria-label="Filter by category">
          {categories.map((cat) => (
            <Link
              key={cat}
              href={`/blog/category/${slugifyCategory(cat)}`}
              className="rounded-lg border border-[var(--tk-card-edge)] px-3 py-1.5 text-[12px] font-medium text-fd-muted-foreground transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
            >
              {cat}
            </Link>
          ))}
        </nav>

        {/* Featured section — page 1 only */}
        {featured.length > 0 && (
          <section className="mb-10">
            <div className="mb-4 flex items-center gap-2">
              <Star className="h-4 w-4 text-[var(--color-fd-primary)]" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-fd-foreground">Featured</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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

        {/* Card grid — a native CTA card is spliced in after the 6th post on page 1 */}
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {posts.flatMap((post, i) => {
            const card = (
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
            )
            return currentPage === 1 && i === 5
              ? [card, <BlogCta key="cta-grid" variant="card" placement="blog_index_grid" />]
              : [card]
          })}
        </div>

        <BlogPagination currentPage={currentPage} totalPages={totalPages} />
      </main>

      {/* Outside <main>'s column: the frame runs the closing band's backdrop
          art to both page edges, the way every other page closes. */}
      <BlogCta variant="band" placement="blog_index_footer" fullBleed />
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
      className="group relative flex flex-col overflow-hidden rounded-2xl border border-[var(--color-fd-primary)]/30 bg-gradient-to-b from-[var(--color-fd-primary)]/5 to-transparent p-4 transition-all hover:border-[var(--color-fd-primary)]/50 hover:shadow-md hover:shadow-[color:var(--color-fd-primary)]/5 dark:from-[var(--color-fd-primary)]/10"
    >
      <span className="mb-2 text-[11px] font-semibold text-[var(--color-fd-primary)]">
        {category}
      </span>
      {image && (
        <div className="relative mb-3 aspect-[1200/630] w-full overflow-hidden rounded-lg">
          <Image
            src={image}
            alt=""
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
      <span className="mt-auto inline-flex items-center gap-1 pt-4 text-xs font-medium text-[var(--color-fd-primary)]">
        Read article
        <ArrowRight
          className="h-3 w-3 transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
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
      })
    : null

  return (
    <Link
      href={`/blog/${slug}`}
      className="group flex flex-col rounded-2xl border border-[var(--tk-card-edge)] bg-fd-card p-4 shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground"
    >
      <span className="mb-2 text-[11px] font-medium text-fd-muted-foreground group-hover:text-fd-accent-foreground/70">
        {category}
      </span>
      {image && (
        <div className="relative mb-3 aspect-[1200/630] w-full overflow-hidden rounded-lg">
          <Image
            src={image}
            alt=""
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
      <span className="mt-auto pt-4 text-xs text-[var(--color-fd-primary)]">
        {formattedDate}
        {formattedDate && readingTime && ' · '}
        {readingTime}
      </span>
    </Link>
  )
}
