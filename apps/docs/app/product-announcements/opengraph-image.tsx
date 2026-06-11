import { generateOGImage } from '@/lib/og-image'

export const alt = 'In-App Announcements for React — 5 variants, one priority queue | userTourKit'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'In-App Announcements',
    subtitle: 'Modal, banner, toast, slideout, spotlight — one queue',
    category: 'ANNOUNCEMENTS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
