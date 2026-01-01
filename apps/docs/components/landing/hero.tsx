import Link from 'next/link';
import { ArrowRight, Github, Sparkles } from 'lucide-react';

export function Hero() {
  return (
    <section className='relative flex flex-col items-center justify-center px-4 py-24 text-center'>
      {/* Background gradient */}
      <div className='absolute inset-0 -z-10 overflow-hidden'>
        <div className='absolute left-1/2 top-0 h-[500px] w-[800px] -translate-x-1/2 rounded-full bg-[var(--tk-primary)] opacity-10 blur-[100px]' />
      </div>

      {/* Badge */}
      <div className='mb-6 inline-flex items-center gap-2 rounded-full border border-[var(--tk-primary)]/20 bg-[var(--tk-primary-container)] px-4 py-1.5 text-sm font-medium text-[var(--tk-primary)]'>
        <Sparkles className='h-4 w-4' />
        <span>Now in Beta - v0.1.0</span>
      </div>

      {/* Title */}
      <h1 className='mb-6 max-w-4xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl'>
        Product Tours{' '}
        <span className='bg-gradient-to-r from-[var(--tk-primary)] to-[#5c9aff] bg-clip-text text-transparent'>
          Made Simple
        </span>
      </h1>

      {/* Subtitle */}
      <p className='mb-8 max-w-2xl text-lg text-fd-muted-foreground sm:text-xl'>
        The most developer-friendly, accessible product tour library for React.
        Headless hooks and pre-styled components that work with shadcn/ui.
      </p>

      {/* CTA Buttons */}
      <div className='flex flex-wrap items-center justify-center gap-4'>
        <Link
          href='/docs/getting-started'
          className='group inline-flex items-center gap-2 rounded-lg bg-[var(--tk-primary)] px-6 py-3 font-medium text-white shadow-lg shadow-[var(--tk-primary)]/25 transition-all hover:shadow-xl hover:shadow-[var(--tk-primary)]/30'
        >
          Get Started
          <ArrowRight className='h-4 w-4 transition-transform group-hover:translate-x-1' />
        </Link>
        <Link
          href='https://github.com/your-username/tour-kit'
          className='inline-flex items-center gap-2 rounded-lg border border-fd-border bg-fd-background px-6 py-3 font-medium transition-colors hover:bg-fd-muted'
        >
          <Github className='h-4 w-4' />
          View on GitHub
        </Link>
      </div>

      {/* Install command */}
      <div className='mt-12 flex items-center gap-2 rounded-lg border border-fd-border bg-fd-card px-4 py-2 font-mono text-sm'>
        <span className='text-fd-muted-foreground'>$</span>
        <code>pnpm add @tour-kit/react</code>
      </div>
    </section>
  );
}
