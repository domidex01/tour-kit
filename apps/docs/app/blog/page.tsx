import { BlogListPage } from '@/components/blog/blog-list-page'
import type { Metadata } from 'next'

const BLOG_TITLE = 'Blog — userTourKit'
const BLOG_DESC =
  'Guides, comparisons, and insights on product tours, onboarding, and developer experience from the userTourKit team.'

export const metadata: Metadata = {
  title: BLOG_TITLE,
  description: BLOG_DESC,
  alternates: {
    canonical: '/blog',
    types: {
      'application/rss+xml': '/blog/feed.xml',
    },
  },
  openGraph: {
    title: BLOG_TITLE,
    description: BLOG_DESC,
    type: 'website',
    url: '/blog',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: BLOG_TITLE,
    description: BLOG_DESC,
    images: ['/og-default.png'],
  },
}

export default function BlogPage() {
  return <BlogListPage page={1} />
}
