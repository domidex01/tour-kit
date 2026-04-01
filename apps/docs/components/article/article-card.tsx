import { ArrowRight } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

interface ArticleCardProps {
  title: string
  description: string
  href: string
  badge?: string
  image?: string
}

export function ArticleCard({ title, description, href, badge, image }: ArticleCardProps) {
  return (
    <Link
      href={href}
      className="group flex flex-col overflow-hidden rounded-lg border border-fd-border bg-fd-card transition-all hover:border-fd-border/80 hover:shadow-md"
    >
      <div className="flex flex-1 flex-col p-6">
        {badge && (
          <span className="mb-3 inline-flex w-fit items-center rounded-full bg-fd-muted px-2.5 py-0.5 text-[11px] font-medium text-fd-muted-foreground">
            {badge}
          </span>
        )}
        {image && (
          <div className="relative mb-4 aspect-[1200/630] w-full overflow-hidden rounded-md">
            <Image
              src={image}
              alt={title}
              fill
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </div>
        )}
        <h3 className="mb-2 text-[15px] font-semibold text-fd-foreground group-hover:text-[#0197f6]">
          {title}
        </h3>
        <p className="mb-4 flex-1 text-[11px] leading-relaxed text-fd-muted-foreground">
          {description}
        </p>
        <span className="inline-flex items-center gap-1 text-[13px] font-medium text-[#0197f6]">
          Read article
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </span>
      </div>
    </Link>
  )
}
