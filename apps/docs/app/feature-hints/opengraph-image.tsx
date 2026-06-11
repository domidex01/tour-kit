import { generateOGImage } from '@/lib/og-image'

export const alt = 'Feature Hints & Beacons for React — free & MIT | userTourKit'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'Feature Hints & Beacons',
    subtitle: 'Pulsing beacons & tooltips for feature discovery — free & MIT',
    category: 'HINTS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
