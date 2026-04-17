import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { getBlogPost, getPublishedBlogPosts } from '@/lib/comparisons'
import { notFound } from 'next/navigation'

export const revalidate = false

export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const post = getBlogPost(slug)
  if (!post) notFound()

  try {
    const filePath = join(process.cwd(), 'content/blog', `${slug}.mdx`)
    const raw = readFileSync(filePath, 'utf-8')

    // Strip frontmatter and JSON-LD scripts, keep the markdown content
    const content = raw
      .replace(/^---[\s\S]*?---\n*/, '')
      .replace(/<script[\s\S]*?<\/script>/g, '')
      .replace(/\{\/\*[\s\S]*?\*\/\}/g, '')
      .trim()

    const markdown = `# ${post.title} (/blog/${slug})

${post.description}

${content}`

    return new Response(markdown, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Cache-Control': 'public, max-age=3600, s-maxage=3600',
      },
    })
  } catch {
    notFound()
  }
}

export function generateStaticParams() {
  return getPublishedBlogPosts().map((p) => ({ slug: p.slug }))
}
