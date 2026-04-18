import { generateOGImage } from '@/lib/og-image'
import { source } from '@/lib/source'

export const alt = 'userTourKit Documentation'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const page = source.getPage(undefined)
  const buffer = await generateOGImage({
    title: page?.data.title ?? 'userTourKit Documentation',
    subtitle: page?.data.description ?? 'Headless product tours for React',
    category: 'DOCS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
