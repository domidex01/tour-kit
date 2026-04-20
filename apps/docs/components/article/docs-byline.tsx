import type { Author } from '@/lib/authors'
import Image from 'next/image'
import Link from 'next/link'

interface DocsBylineProps {
  author: Author
  /** ISO string — first commit of the docs file. */
  datePublished: string
  /** ISO string — last commit of the docs file. */
  dateModified: string
}

function formatDate(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return iso
  return d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
}

export function DocsByline({ author, datePublished, dateModified }: DocsBylineProps) {
  const published = formatDate(datePublished)
  const modified = formatDate(dateModified)
  const showModified = dateModified !== datePublished

  return (
    <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-2 text-[13px] text-fd-muted-foreground">
      <Link
        href={author.url}
        className="flex shrink-0 items-center gap-2 text-fd-foreground transition-opacity hover:opacity-80"
      >
        <Image
          src={author.avatar}
          alt=""
          width={24}
          height={24}
          className="rounded-full"
          aria-hidden="true"
        />
        <span className="text-[13px] font-medium">{author.name}</span>
      </Link>
      <span className="text-fd-border" aria-hidden="true">
        ·
      </span>
      <span>
        Published <time dateTime={datePublished}>{published}</time>
      </span>
      {showModified && (
        <>
          <span aria-hidden="true">·</span>
          <span>
            Updated <time dateTime={dateModified}>{modified}</time>
          </span>
        </>
      )}
    </div>
  )
}
