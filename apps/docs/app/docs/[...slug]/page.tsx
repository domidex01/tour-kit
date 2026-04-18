import { source } from '@/lib/source'
import type { Metadata } from 'next'
import { getDocsMetadata, renderDocsPage } from '../_page-logic'

interface PageProps {
  params: Promise<{ slug: string[] }>
}

export default async function Page({ params }: PageProps) {
  const { slug } = await params
  return renderDocsPage(slug)
}

export async function generateStaticParams() {
  return source.generateParams().filter((p) => Array.isArray(p.slug) && p.slug.length > 0)
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  return getDocsMetadata(slug)
}
