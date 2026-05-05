import type { AnnouncementConfig } from '../types/announcement'
import { escapeXml } from './escape'

/**
 * Public, JSON-serializable changelog entry used by `serializeFeed`.
 *
 * Extends `AnnouncementConfig` with publish-time metadata. Reuses the
 * announcement shape so a config that already drives an in-app modal can
 * simultaneously be syndicated as RSS/JSON Feed.
 */
export interface ChangelogEntry extends AnnouncementConfig {
  /**
   * Stable publish timestamp. Accepts a `Date` or any `Date`-parseable string
   * (ISO 8601 recommended). Invalid values cause `serializeFeed` to throw a
   * `TypeError` rather than emitting `Invalid Date` into the feed.
   */
  publishedAt: Date | string

  /**
   * Absolute URL of the canonical changelog page for this entry. Used as
   * the RSS `<link>` and the JSON Feed `url` field.
   */
  permalink: string

  /**
   * Optional category tag (e.g. `'feature'`, `'fix'`). Surfaces as `<category>`
   * in RSS and `tags: [category]` in JSON Feed.
   */
  category?: string

  /**
   * Optional rendered HTML body. Emitted only as JSON Feed `content_html`;
   * RSS `<description>` always uses the plain-string `description` field
   * (never raw HTML, to keep the entity-escape contract intact).
   */
  contentHtml?: string
}

/**
 * Publisher-level metadata applied once per feed.
 *
 * `feedUrl` is the base URL of the changelog feed routes; the serializer
 * appends `.xml` for the RSS self-link and `.json` for the JSON Feed
 * `feed_url`. Example: `'https://acme.com/changelog'` → routes
 * `https://acme.com/changelog.xml` and `https://acme.com/changelog.json`.
 */
export interface SerializeFeedOptions {
  title: string
  description: string
  siteUrl: string
  feedUrl: string
  language?: string
  copyright?: string
}

/**
 * Pure, side-effect-free RSS 2.0 + JSON Feed 1.1 serializer.
 *
 * Throws `TypeError` when any entry has an invalid `publishedAt` — fail-fast
 * to avoid emitting `Invalid Date` strings into a live feed.
 */
export function serializeFeed(
  entries: ChangelogEntry[],
  opts: SerializeFeedOptions,
): { rss: string; jsonFeed: string } {
  for (const e of entries) {
    validateDate(e.publishedAt, e.id)
  }
  return {
    rss: serializeRss(entries, opts),
    jsonFeed: serializeJsonFeed(entries, opts),
  }
}

function validateDate(input: Date | string, entryId: string): Date {
  const d = new Date(input)
  if (Number.isNaN(d.getTime())) {
    throw new TypeError(
      `serializeFeed: invalid publishedAt for entry "${entryId}"`,
    )
  }
  return d
}

function serializeRss(entries: ChangelogEntry[], opts: SerializeFeedOptions): string {
  const items = entries
    .map((e) => {
      const title = escapeXml(typeof e.title === 'string' ? e.title : '')
      const desc = escapeXml(typeof e.description === 'string' ? e.description : '')
      const cat = e.category ? `<category>${escapeXml(e.category)}</category>` : ''
      return `<item>
  <title>${title}</title>
  <link>${escapeXml(e.permalink)}</link>
  <guid isPermaLink="false">${escapeXml(e.id)}</guid>
  <pubDate>${new Date(e.publishedAt).toUTCString()}</pubDate>
  <description>${desc}</description>
  ${cat}
</item>`
    })
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
  <title>${escapeXml(opts.title)}</title>
  <link>${escapeXml(opts.siteUrl)}</link>
  <description>${escapeXml(opts.description)}</description>
  <language>${escapeXml(opts.language ?? 'en')}</language>
  <atom:link href="${escapeXml(opts.feedUrl)}.xml" rel="self" type="application/rss+xml"/>
  ${opts.copyright ? `<copyright>${escapeXml(opts.copyright)}</copyright>` : ''}
${items}
</channel>
</rss>`
}

function serializeJsonFeed(entries: ChangelogEntry[], opts: SerializeFeedOptions): string {
  return JSON.stringify(
    {
      version: 'https://jsonfeed.org/version/1.1',
      title: opts.title,
      description: opts.description,
      home_page_url: opts.siteUrl,
      feed_url: `${opts.feedUrl}.json`,
      language: opts.language ?? 'en',
      items: entries.map((e) => ({
        id: e.id,
        url: e.permalink,
        title: typeof e.title === 'string' ? e.title : undefined,
        content_html: e.contentHtml,
        content_text: typeof e.description === 'string' ? e.description : undefined,
        date_published: new Date(e.publishedAt).toISOString(),
        tags: e.category ? [e.category] : undefined,
      })),
    },
    null,
    2,
  )
}
