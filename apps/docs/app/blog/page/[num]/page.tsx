import { BlogListPage } from '@/components/blog/blog-list-page'
import { getBlogPageCount } from '@/lib/blog'
import type { Metadata } from 'next'
import { notFound } from 'next/navigation'

interface PageProps {
  params: Promise<{ num: string }>
}

export function generateStaticParams() {
  const totalPages = getBlogPageCount()
  return Array.from({ length: totalPages - 1 }, (_, i) => ({
    num: String(i + 2),
  }))
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { num } = await params
  const page = Number.parseInt(num, 10)
  const totalPages = getBlogPageCount()

  if (Number.isNaN(page) || page < 2 || page > totalPages) return {}

  const title = `Blog — Page ${page} — userTourKit`
  const desc = `Page ${page} of guides, comparisons, and insights on product tours and onboarding from the userTourKit team.`

  return {
    title,
    description: desc,
    alternates: {
      canonical: `/blog/page/${page}`,
    },
    openGraph: {
      title,
      description: desc,
      type: 'website',
      url: `/blog/page/${page}`,
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

export default async function PaginatedBlogPage({ params }: PageProps) {
  const { num } = await params
  const page = Number.parseInt(num, 10)
  const totalPages = getBlogPageCount()

  if (Number.isNaN(page) || page < 2 || page > totalPages) {
    notFound()
  }

  return <BlogListPage page={page} />
}
