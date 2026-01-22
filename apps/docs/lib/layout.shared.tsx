import type { BaseLayoutProps } from 'fumadocs-ui/layouts/shared'
import { BookOpen, Code2, Layers, Sparkles } from 'lucide-react'

/**
 * Shared layout options used by both home and docs layouts
 */
export function baseOptions(): BaseLayoutProps {
  return {
    nav: {
      title: (
        <span className="font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[var(--tk-primary)]" />
          <span>TourKit</span>
        </span>
      ),
    },
    links: [
      {
        text: 'Docs',
        url: '/docs',
        icon: <BookOpen className="w-4 h-4" />,
      },
      {
        text: 'API',
        url: '/docs/api',
        icon: <Code2 className="w-4 h-4" />,
      },
      {
        text: 'Examples',
        url: '/docs/examples',
        icon: <Layers className="w-4 h-4" />,
      },
    ],
    githubUrl: 'https://github.com/domidex/tour-kit',
  }
}
