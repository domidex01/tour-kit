import { generateOGImage } from '@/lib/og-image'

export const alt = 'userTourKit — Headless product tours for React'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'userTourKit',
    subtitle: 'Headless product tours for React',
    category: 'DEV TOOLS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
