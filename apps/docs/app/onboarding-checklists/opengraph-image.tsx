import { generateOGImage } from '@/lib/og-image'

export const alt = 'Onboarding Checklists for React — task dependencies & persistence | userTourKit'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  const buffer = await generateOGImage({
    title: 'Onboarding Checklists',
    subtitle: 'Task dependencies, persistence, your design system',
    category: 'CHECKLISTS',
  })

  return new Response(new Uint8Array(buffer), {
    headers: { 'Content-Type': 'image/png' },
  })
}
