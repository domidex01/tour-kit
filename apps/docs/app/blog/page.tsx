import { BlogListPage } from '@/components/blog/blog-list-page'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Blog — userTourKit',
  description:
    'Guides, comparisons, and insights on product tours, onboarding, and developer experience from the userTourKit team.',
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/blog/feed.xml',
    },
  },
  openGraph: {
    title: 'Blog — userTourKit',
    description:
      'Guides, comparisons, and insights on product tours, onboarding, and developer experience.',
    type: 'website',
  },
}

export default function BlogPage() {
  return <BlogListPage page={1} />
}
