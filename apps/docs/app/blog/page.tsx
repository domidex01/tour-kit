import { ArticleCard } from '@/components/article/article-card'
import { Footer } from '@/components/landing/footer'
import { getPublishedBlogPosts } from '@/lib/comparisons'
import { baseOptions } from '@/lib/layout.shared'
import { BreadcrumbJsonLd, OrganizationJsonLd } from '@/lib/structured-data'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — User Tour Kit',
  description:
    'Guides, comparisons, and insights on product tours, onboarding, and developer experience from the User Tour Kit team.',
  openGraph: {
    title: 'Blog — User Tour Kit',
    description:
      'Guides, comparisons, and insights on product tours, onboarding, and developer experience.',
    type: 'website',
  },
}

export default function BlogHub() {
  return (
    <HomeLayout {...baseOptions()}>
      <OrganizationJsonLd />
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', url: '/' },
          { name: 'Blog', url: '/blog' },
        ]}
      />
      <main className="mx-auto w-full max-w-[1120px] px-6 py-16 sm:px-8 lg:px-12">
        <header className="mb-16 max-w-2xl">
          <h1 className="mb-4 text-3xl font-extrabold leading-tight tracking-[-0.02em] text-fd-foreground sm:text-4xl">
            Blog
          </h1>
          <p className="text-[16px] leading-relaxed text-fd-muted-foreground">
            Guides, rankings, and insights on product tours, onboarding best practices, and
            developer experience from the User Tour Kit team.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {getPublishedBlogPosts().map((post) => (
            <ArticleCard
              key={post.slug}
              title={post.title}
              description={post.description}
              href={`/blog/${post.slug}`}
              badge={post.category}
              image={post.ogImage}
            />
          ))}
        </div>
      </main>
      <Footer />
    </HomeLayout>
  )
}
