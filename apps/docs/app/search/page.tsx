import { searchDocs } from '@/lib/docs-api'
import { baseOptions } from '@/lib/layout.shared'
import { HomeLayout } from 'fumadocs-ui/layouts/home'
import type { Metadata } from 'next'
import Link from 'next/link'

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>
}

export const metadata: Metadata = {
  title: 'Search',
  description: 'Search userTourKit documentation.',
  robots: { index: false, follow: true },
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams
  const query = q?.trim() ?? ''
  const results = query ? searchDocs(query, { limit: 20 }) : []

  return (
    <HomeLayout {...baseOptions()}>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-16">
        <h1 className="mb-2 text-3xl font-bold tracking-tight">Search</h1>
        <form method="get" action="/search" className="mb-8">
          <label htmlFor="q" className="sr-only">
            Search query
          </label>
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={query}
            placeholder="Search the docs…"
            className="w-full rounded-lg border border-fd-border bg-fd-background px-4 py-3 text-base shadow-sm outline-none focus:border-fd-primary focus:ring-2 focus:ring-fd-primary/30"
          />
        </form>

        {query === '' ? (
          <p className="text-fd-muted-foreground">
            Enter a query above to search the documentation.
          </p>
        ) : results.length === 0 ? (
          <p className="text-fd-muted-foreground">
            No results for <strong>&ldquo;{query}&rdquo;</strong>. Try a broader term.
          </p>
        ) : (
          <ul className="flex flex-col gap-4">
            {results.map((r) => (
              <li key={r.url}>
                <Link
                  href={r.url}
                  className="group block rounded-lg border border-fd-border p-4 transition-colors hover:border-fd-primary/50 hover:bg-fd-muted/30"
                >
                  <div className="mb-1 text-xs uppercase tracking-wide text-fd-muted-foreground">
                    {r.section}
                  </div>
                  <div className="mb-1 text-lg font-semibold group-hover:text-fd-primary">
                    {r.title}
                  </div>
                  <div className="text-sm text-fd-muted-foreground">{r.description}</div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </HomeLayout>
  )
}
