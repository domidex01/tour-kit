import { checkRateLimit, corsPreflightResponse, withCors } from '@/lib/api-middleware'
import { searchDocs } from '@/lib/docs-api'
import { type NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const origin = request.headers.get('origin')
  const { searchParams } = request.nextUrl

  const q = searchParams.get('q')
  if (!q || q.trim().length === 0) {
    return withCors(
      NextResponse.json({ error: 'Missing required query parameter: q' }, { status: 400 }),
      origin
    )
  }

  const section = searchParams.get('section') ?? undefined
  const limitParam = searchParams.get('limit')
  const limit = limitParam ? Math.min(Math.max(1, Number.parseInt(limitParam, 10) || 10), 50) : 10

  const results = searchDocs(q, { section, limit })

  const response = NextResponse.json({
    results,
    total: results.length,
    query: q,
    ...(section && { section }),
  })
  response.headers.set('Cache-Control', 's-maxage=60, stale-while-revalidate=300')
  return withCors(response, origin)
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get('origin'))
}
