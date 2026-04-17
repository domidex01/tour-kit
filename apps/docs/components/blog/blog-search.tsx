'use client'

import { Search, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

interface SearchablePost {
  slug: string
  title: string
  description: string
  category: string
  keywords: string[]
  image?: string
  publishedAt?: string
  readingTime?: string
}

export function BlogSearch({ posts }: { posts: SearchablePost[] }) {
  const [query, setQuery] = useState('')

  const results = useMemo(() => {
    if (!query.trim()) return null
    const q = query.toLowerCase()
    return posts.filter(
      (p) =>
        p.title.toLowerCase().includes(q) ||
        p.description.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.keywords.some((k) => k.toLowerCase().includes(q))
    )
  }, [query, posts])

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-fd-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search articles..."
          className="h-10 w-full rounded-xl border border-fd-border/50 bg-fd-card pl-10 pr-10 text-[14px] text-fd-foreground placeholder:text-fd-muted-foreground focus:border-[#0197f6] focus:outline-none focus:ring-1 focus:ring-[#0197f6] dark:border-fd-border"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-fd-muted-foreground hover:text-fd-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {results !== null && (
        <div className="mt-2 rounded-xl border border-fd-border/50 bg-fd-card p-2 shadow-lg dark:border-fd-border">
          {results.length === 0 ? (
            <p className="px-3 py-6 text-center text-sm text-fd-muted-foreground">
              No articles found for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <div className="max-h-[400px] overflow-y-auto">
              <p className="px-3 py-1.5 text-[11px] font-medium text-fd-muted-foreground">
                {results.length} result{results.length !== 1 ? 's' : ''}
              </p>
              {results.slice(0, 10).map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  onClick={() => setQuery('')}
                  className="flex items-center gap-3 rounded-lg px-3 py-2 transition-colors hover:bg-fd-accent"
                >
                  {post.image && (
                    <div className="relative h-10 w-16 shrink-0 overflow-hidden rounded-md">
                      <Image src={post.image} alt="" fill sizes="64px" className="object-cover" />
                    </div>
                  )}
                  <div className="min-w-0">
                    <span className="block truncate text-[13px] font-medium text-fd-foreground">
                      {post.title}
                    </span>
                    <span className="block truncate text-[11px] text-fd-muted-foreground">
                      {post.category}
                      {post.readingTime && ` · ${post.readingTime}`}
                    </span>
                  </div>
                </Link>
              ))}
              {results.length > 10 && (
                <p className="px-3 py-2 text-[11px] text-fd-muted-foreground">
                  +{results.length - 10} more results
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
