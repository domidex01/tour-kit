import { HomeLayout } from 'fumadocs-ui/layouts/home';
import { baseOptions } from '@/lib/layout.shared';
import { Hero } from '@/components/landing/hero';
import { Features } from '@/components/landing/features';
import { Packages } from '@/components/landing/packages';
import { CodePreview } from '@/components/landing/code-preview';
import { DemoTour } from '@/components/landing/demo-tour';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function HomePage() {
  return (
    <HomeLayout {...baseOptions()}>
      <main className='flex flex-1 flex-col'>
        <Hero />
        <Features />
        <Packages />
        <CodePreview />
        <DemoTour />

        {/* Final CTA */}
        <section className='bg-gradient-to-b from-fd-background to-[var(--tk-primary-container)]/20 px-4 py-24 text-center'>
          <h2 className='mb-4 text-3xl font-bold sm:text-4xl'>
            Ready to Get Started?
          </h2>
          <p className='mb-8 text-lg text-fd-muted-foreground'>
            Build amazing onboarding experiences in minutes.
          </p>
          <Link
            href='/docs/getting-started'
            className='inline-flex items-center gap-2 rounded-lg bg-[var(--tk-primary)] px-8 py-4 text-lg font-medium text-white shadow-lg shadow-[var(--tk-primary)]/25 transition-all hover:shadow-xl'
          >
            Get Started
            <ArrowRight className='h-5 w-5' />
          </Link>
        </section>
      </main>
    </HomeLayout>
  );
}
