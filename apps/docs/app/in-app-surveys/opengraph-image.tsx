import { generateOGImage } from '@/lib/og-image'

export const alt = 'In-App Surveys & NPS for React — skip logic & fatigue prevention | userTourKit'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'In-App Surveys & NPS',
    subtitle: 'NPS, CSAT, CES with skip logic & fatigue prevention',
    category: 'SURVEYS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
