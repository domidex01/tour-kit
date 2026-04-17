import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'

interface BlogPaginationProps {
  currentPage: number
  totalPages: number
}

function pageHref(page: number): string {
  return page === 1 ? '/blog' : `/blog/page/${page}`
}

export function BlogPagination({ currentPage, totalPages }: BlogPaginationProps) {
  if (totalPages <= 1) return null

  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)

  return (
    <nav aria-label="Blog pagination" className="mt-12 flex items-center justify-center gap-2">
      {currentPage > 1 ? (
        <Link
          href={pageHref(currentPage - 1)}
          rel="prev"
          className="inline-flex items-center gap-1 rounded-md border border-fd-border px-3 py-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        >
          <ChevronLeft className="h-4 w-4" />
          Previous
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-fd-border px-3 py-2 text-sm font-medium text-fd-muted-foreground/40">
          <ChevronLeft className="h-4 w-4" />
          Previous
        </span>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={pageHref(page)}
          aria-current={page === currentPage ? 'page' : undefined}
          className={`inline-flex h-9 w-9 items-center justify-center rounded-md text-sm font-medium transition-colors ${
            page === currentPage
              ? 'bg-[#0197f6] text-white'
              : 'border border-fd-border text-fd-muted-foreground hover:bg-fd-muted hover:text-fd-foreground'
          }`}
        >
          {page}
        </Link>
      ))}

      {currentPage < totalPages ? (
        <Link
          href={pageHref(currentPage + 1)}
          rel="next"
          className="inline-flex items-center gap-1 rounded-md border border-fd-border px-3 py-2 text-sm font-medium text-fd-muted-foreground transition-colors hover:bg-fd-muted hover:text-fd-foreground"
        >
          Next
          <ChevronRight className="h-4 w-4" />
        </Link>
      ) : (
        <span className="inline-flex items-center gap-1 rounded-md border border-fd-border px-3 py-2 text-sm font-medium text-fd-muted-foreground/40">
          Next
          <ChevronRight className="h-4 w-4" />
        </span>
      )}
    </nav>
  )
}
