import { generateOGImage } from '@/lib/og-image'
import type { NextRequest } from 'next/server'

// Cap query lengths to keep image rendering fast and prevent abuse.
const MAX_TITLE = 120
const MAX_SUBTITLE = 200
const MAX_CATEGORY = 40

function clamp(value: string | null, max: number, fallback = ''): string {
  if (!value) return fallback
  return value.slice(0, max)
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl

  const title = clamp(searchParams.get('title'), MAX_TITLE, 'userTourKit')
  const subtitleRaw = searchParams.get('subtitle')
  const subtitle = subtitleRaw ? clamp(subtitleRaw, MAX_SUBTITLE) : undefined
  const categoryRaw = searchParams.get('category')
  const category = categoryRaw ? clamp(categoryRaw, MAX_CATEGORY) : undefined

  const buffer = await generateOGImage({ title, subtitle, category })

  return new Response(new Uint8Array(buffer), {
    headers: {
      'Content-Type': 'image/png',
      // Cache at the edge for a day; stale-while-revalidate for a week.
      'Cache-Control': 'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
    },
  })
}
