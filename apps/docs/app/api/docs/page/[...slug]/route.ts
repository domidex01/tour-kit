import { checkRateLimit, corsPreflightResponse, withCors } from '@/lib/api-middleware'
import { getDocPage } from '@/lib/docs-api'
import { type NextRequest, NextResponse } from 'next/server'

interface RouteParams {
  params: Promise<{ slug: string[] }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const origin = request.headers.get('origin')
  const { slug } = await params

  const page = getDocPage(slug)
  if (!page) {
    return withCors(NextResponse.json({ error: 'Page not found' }, { status: 404 }), origin)
  }

  const response = NextResponse.json(page)
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  return withCors(response, origin)
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get('origin'))
}
