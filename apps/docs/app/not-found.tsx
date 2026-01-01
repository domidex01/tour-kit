import Link from 'next/link';

export default function NotFound() {
  return (
    <div className='flex min-h-screen flex-col items-center justify-center p-4 text-center'>
      <h1 className='mb-4 text-6xl font-bold'>404</h1>
      <p className='mb-8 text-xl text-fd-muted-foreground'>Page not found</p>
      <Link
        href='/docs'
        className='rounded-lg bg-[var(--tk-primary)] px-6 py-3 font-medium text-white transition-opacity hover:opacity-90'
      >
        Back to Docs
      </Link>
    </div>
  );
}
