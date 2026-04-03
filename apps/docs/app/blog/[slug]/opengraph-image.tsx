import { getBlogPost } from '@/lib/comparisons'
import { generateOGImage } from '@/lib/og-image'

export const alt = 'userTourKit Blog'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)

  const buffer = await generateOGImage({
    title: post?.title ?? 'userTourKit Blog',
    subtitle: post?.description,
    category: post?.category?.toUpperCase(),
    background: (post as any)?.ogBackground,
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
