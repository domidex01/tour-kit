import { getPublishedBlogPosts } from '@/lib/comparisons'
import { Feed } from 'feed'

const SITE_URL = 'https://usertourkit.com'

export function generateBlogRSS(): string {
  const posts = getPublishedBlogPosts()

  const feed = new Feed({
    title: 'userTourKit Blog',
    description:
      'Guides, comparisons, and insights on product tours, onboarding, and developer experience.',
    id: `${SITE_URL}/blog`,
    link: `${SITE_URL}/blog`,
    language: 'en',
    image: `${SITE_URL}/logo.png`,
    favicon: `${SITE_URL}/favicon.ico`,
    copyright: `All rights reserved ${new Date().getFullYear()}, userTourKit`,
    feedLinks: {
      rss2: `${SITE_URL}/blog/feed.xml`,
    },
  })

  for (const post of posts.slice(0, 50)) {
    feed.addItem({
      id: `${SITE_URL}/blog/${post.slug}`,
      title: post.title,
      description: post.description,
      link: `${SITE_URL}/blog/${post.slug}`,
      date: new Date(post.publishedAt ?? post.lastUpdated ?? new Date().toISOString()),
      category: [{ name: post.category }],
      ...(post.ogImage && { image: `${SITE_URL}${post.ogImage}` }),
      author: [{ name: 'domidex01', link: 'https://github.com/domidex01' }],
    })
  }

  return feed.rss2()
}
