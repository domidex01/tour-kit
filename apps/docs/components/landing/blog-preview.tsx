import { SectionHead } from '@/components/landing/section-head'
import { getFeaturedBlogPosts, getReadingTime } from '@/lib/blog'
import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export function BlogPreview() {
  const posts = getFeaturedBlogPosts()
  if (posts.length === 0) return null

  return (
    <section className="px-6 py-36 sm:px-8 lg:px-12">
      <div className="mx-auto max-w-[1120px]">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <SectionHead title="From the blog.">
            Technical deep-dives, honest comparisons, and shipping tutorials. No listicles, no
            affiliate content, written for the engineers who will read the code.
          </SectionHead>
          <Link
            href="/blog"
            className="group inline-flex items-center gap-2 text-[14px] font-semibold text-[var(--color-fd-primary)] underline underline-offset-4 transition-colors hover:opacity-80"
          >
            All articles
            <ArrowRight
              className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </Link>
        </div>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.slug}
              href={`/blog/${post.slug}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-[var(--tk-card-edge)] bg-fd-muted p-4 transition-all hover:-translate-y-0.5 hover:shadow-md"
            >
              <span className="mb-2 text-[11px] font-semibold uppercase tracking-[0.06em] text-[var(--color-fd-primary)]">
                {post.category}
              </span>
              {post.ogImage && (
                <div className="relative mb-4 aspect-[1200/630] w-full overflow-hidden rounded-lg">
                  <Image
                    src={post.ogImage}
                    alt=""
                    fill
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                    className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                </div>
              )}
              <h3 className="mb-2 text-[16px] font-semibold leading-snug text-fd-foreground">
                {post.title}
              </h3>
              <p className="line-clamp-2 text-[13px] leading-relaxed text-fd-muted-foreground">
                {post.description}
              </p>
              <span className="mt-auto inline-flex items-center gap-1.5 pt-4 text-[12px] text-fd-muted-foreground">
                {getReadingTime(post.slug)}
                <span className="opacity-30">&middot;</span>
                <span className="font-semibold text-[var(--color-fd-primary)]">Read &rarr;</span>
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
