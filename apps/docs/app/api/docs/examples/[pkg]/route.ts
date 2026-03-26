import { NextRequest, NextResponse } from 'next/server'
import { getCodeExamples } from '@/lib/docs-api'
import {
  withCors,
  corsPreflightResponse,
  checkRateLimit,
} from '@/lib/api-middleware'

const VALID_PACKAGES = [
  'core',
  'react',
  'hints',
  'adoption',
  'analytics',
  'announcements',
  'checklists',
  'media',
  'scheduling',
] as const

interface RouteParams {
  params: Promise<{ pkg: string }>
}

export async function GET(request: NextRequest, { params }: RouteParams) {
  const rateLimited = checkRateLimit(request)
  if (rateLimited) return rateLimited

  const origin = request.headers.get('origin')
  const { pkg } = await params

  if (!VALID_PACKAGES.includes(pkg as (typeof VALID_PACKAGES)[number])) {
    return withCors(
      NextResponse.json(
        {
          error: `Unknown package: ${pkg}. Valid packages: ${VALID_PACKAGES.join(', ')}`,
        },
        { status: 400 }
      ),
      origin
    )
  }

  const examples = getCodeExamples(pkg)

  const response = NextResponse.json({
    package: pkg,
    examples,
    count: examples.length,
  })
  response.headers.set(
    'Cache-Control',
    's-maxage=60, stale-while-revalidate=300'
  )
  return withCors(response, origin)
}

export async function OPTIONS(request: NextRequest) {
  return corsPreflightResponse(request.headers.get('origin'))
}
