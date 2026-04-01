import { ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface ArticleCardProps {
  title: string
  description: string
  href: string
  badge?: string
}

export function ArticleCard({ title, description, href, badge }: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col rounded-lg border border-fd-border bg-fd-card p-6 transition-all hover:border-fd-border/80 hover:shadow-md"
    >
      {badge && (
        <span className="mb-3 inline-flex w-fit items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
          {badge}
        </span>
      )}
      <h3 className="mb-2 text-[15px] font-semibold text-fd-foreground group-hover:text-[#0197f6]">
        {title}
      </h3>
      <p className="mb-4 flex-1 text-[13px] leading-relaxed text-fd-muted-foreground">
        {description}
      </p>
      <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0197f6]">
        Read comparison
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </span>
    </Link>
  )
}
