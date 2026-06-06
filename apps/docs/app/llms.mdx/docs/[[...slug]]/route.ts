import { getLLMText } from '@/lib/get-llm-text'
import { markdownHeaders } from '@/lib/markdown-response'
import { source } from '@/lib/source'
import { notFound } from 'next/navigation'

export const revalidate = false

export async function GET(_req: Request, { params }: { params: Promise<{ slug?: string[] }> }) {
  const { slug } = await params
  const page = source.getPage(slug)
  if (!page) notFound()

  const body = await getLLMText(page)
  return new Response(body, { headers: markdownHeaders(body) })
}

export function generateStaticParams() {
  return source.generateParams()
}
