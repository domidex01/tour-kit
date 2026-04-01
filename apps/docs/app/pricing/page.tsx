import { Pricing } from '@/components/landing/pricing'
import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Pricing — User Tour Kit',
  description:
    'Simple one-time pricing for User Tour Kit Pro. Free core packages, $99 for all extended packages.',
}

export default function PricingPage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className="flex flex-1 flex-col">
        <Pricing />
      </main>
    </HomeLayout>
  )
}
