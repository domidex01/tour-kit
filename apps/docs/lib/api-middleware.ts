import { NextRequest, NextResponse } from 'next/server'

const ALLOWED_ORIGINS = [
  'https://chat.openai.com',
  'https://chatgpt.com',
  'https://platform.openai.com',
]

const rateLimitMap = new Map<string, number[]>()
const RATE_LIMIT = 10 // requests per second
const WINDOW_MS = 1000

export function withCors(
  response: NextResponse,
  origin?: string | null
): NextResponse {
  if (origin && ALLOWED_ORIGINS.includes(origin)) {
    response.headers.set('Access-Control-Allow-Origin', origin)
    response.headers.set('Access-Control-Allow-Methods', 'GET, OPTIONS')
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type')
  }
  return response
}

export function corsPreflightResponse(
  origin?: string | null
): NextResponse {
  const response = new NextResponse(null, { status: 200 })
  return withCors(response, origin)
}

export function checkRateLimit(request: NextRequest): NextResponse | null {
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown'
  const now = Date.now()
  const timestamps = rateLimitMap.get(ip) ?? []
  const recent = timestamps.filter((t) => now - t < WINDOW_MS)

  if (recent.length >= RATE_LIMIT) {
    return NextResponse.json(
      { error: 'Rate limit exceeded', retryAfter: 1 },
      { status: 429 }
    )
  }

  recent.push(now)
  rateLimitMap.set(ip, recent)
  return null
}
