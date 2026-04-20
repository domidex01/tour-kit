import { Footer } from '@/components/landing/footer'
import {
  getBlogCategories,
  getCategoryDisplayName,
  getCategoryIntro,
  getPostsByCategory,
  getReadingTime,
  slugifyCategory,
} from '@/lib/blog'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, ItemListJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ category: string }>
}

export function generateStaticParams() {
  return getBlogCategories().map((c) => ({ category: slugifyCategory(c) }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { category } = await params
  const display = getCategoryDisplayName(category) ?? category
  const title = `${display} articles — userTourKit Blog`
  const desc = `Browse all ${display} articles on the userTourKit blog.`
  return {
    title,
    description: desc,
    alternates: { canonical: `/blog/category/${category}` },
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `/blog/category/${category}`,
      images: ['/og-default.png'],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description: desc,
      images: ['/og-default.png'],
    },
  }
}

export default async function CategoryPage({ params }: PageProps) {
  const { category } = await params
  const display = getCategoryDisplayName(category) ?? category
  const posts = getPostsByCategory(category)
  if (posts.length === 0) notFound()

  return (
    <HomeLayout {...baseOptions()}>
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
          { name: display, url: `/blog/category/${category}` },
        ]}
      />
      <ItemListJsonLd
        name={`${display} articles`}
        url={`/blog/category/${category}`}
        items={posts.map((post) => ({
          url: `/blog/${post.slug}`,
          name: post.title.replace(/["']/g, ''),
        }))}
      />

      {/* Hero banner */}
      <div className="relative overflow-hidden border-b border-fd-border/50 dark:border-fd-border">
        <div className="relative z-10 mx-auto max-w-[1400px] px-6 pb-16 pt-24 sm:px-8 sm:pb-20 sm:pt-32 lg:px-12">
          <Link
            href="/blog"
            className="mb-4 inline-flex text-[13px] text-fd-muted-foreground transition-colors hover:text-fd-foreground"
          >
            &larr; All articles
          </Link>
          <h1 className="mb-2 text-3xl font-bold text-fd-foreground sm:text-4xl">{display}</h1>
          {(() => {
            const intro = getCategoryIntro(category)
            if (intro) {
              return (
                <>
                  <p className="max-w-2xl text-[15px] leading-relaxed text-fd-muted-foreground">
                    {intro}
                  </p>
                  <p className="mt-3 text-[13px] text-fd-muted-foreground">
                    {posts.length} article{posts.length !== 1 ? 's' : ''}
                  </p>
                </>
              )
            }
            return (
              <p className="text-[15px] text-fd-muted-foreground">
                {posts.length} article{posts.length !== 1 ? 's' : ''}
              </p>
            )
          })()}
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
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="h-full w-full object-cover opacity-60 dark:hidden"
          />
          <img
            src="/blog-hero-dark.png"
            alt=""
            aria-hidden="true"
            loading="eager"
            decoding="async"
            fetchPriority="high"
            className="hidden h-full w-full object-cover opacity-60 dark:block"
          />
        </div>
      </div>

      <main id="main-content" className="mx-auto w-full max-w-[1400px] px-6 py-10 sm:px-8 lg:px-12">
        <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4">
          {posts.map((post) => {
            const formattedDate = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                })
              : null
            const rt = getReadingTime(post.slug)

            return (
              <Link
                key={post.slug}
                href={`/blog/${post.slug}`}
                className="group flex flex-col rounded-2xl border border-fd-border/50 bg-fd-card p-4 shadow-sm transition-colors hover:bg-fd-accent hover:text-fd-accent-foreground dark:border-fd-border"
              >
                <span className="mb-2 text-[11px] font-medium text-fd-muted-foreground group-hover:text-fd-accent-foreground/70">
                  {post.category}
                </span>
                {post.ogImage && (
                  <div className="relative mb-3 aspect-[1200/630] w-full overflow-hidden rounded-lg">
                    <Image
                      src={post.ogImage}
                      alt={post.title}
                      fill
                      sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                )}
                <span className="font-medium leading-snug">{post.title}</span>
                <span className="mt-1.5 text-sm leading-relaxed text-fd-muted-foreground line-clamp-2 group-hover:text-fd-accent-foreground/70">
                  {post.description}
                </span>
                <span className="mt-auto pt-4 text-xs text-[#0197f6]">
                  {formattedDate}
                  {formattedDate && rt && ' · '}
                  {rt}
                </span>
              </Link>
            )
          })}
        </div>
      </main>
      <Footer />
    </HomeLayout>
  )
}
