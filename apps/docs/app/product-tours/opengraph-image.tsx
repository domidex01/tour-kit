import { generateOGImage } from '@/lib/og-image'

export const alt = 'Product Tours for React — headless, accessible, free & MIT | userTourKit'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'Product Tours for React',
    subtitle: 'Headless, accessible, router-aware — free & MIT',
    category: 'TOURS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
