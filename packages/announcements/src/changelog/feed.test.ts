import Ajv from 'ajv'
import { XMLParser } from 'fast-xml-parser'
import { describe, expect, it } from 'vitest'
import schema from './__fixtures__/jsonfeed-1.1.schema.json'
import { ADVERSARIAL_ENTRY, ADVERSARIAL_OPTS } from './adversarial-fixtures'
import { type ChangelogEntry, type SerializeFeedOptions, serializeFeed } from './feed'

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: '@' })

const baseOpts: SerializeFeedOptions = {
  title: 'Acme Changelog',
  description: 'Product updates',
  siteUrl: 'https://acme.com',
  feedUrl: 'https://acme.com/changelog',
  language: 'en',
}

const baseEntry: ChangelogEntry = {
  id: 'evt-1',
  variant: 'modal',
  title: 'Welcome',
  description: 'A new feature',
  permalink: 'https://acme.com/changelog/welcome',
  publishedAt: new Date('2026-05-04T00:00:00Z'),
  category: 'feature',
}

describe('serializeFeed', () => {
  describe('return shape', () => {
    it('returns both rss and jsonFeed strings', () => {
      const out = serializeFeed([baseEntry], baseOpts)
      expect(typeof out.rss).toBe('string')
      expect(typeof out.jsonFeed).toBe('string')
      expect(out.rss.length).toBeGreaterThan(0)
      expect(out.jsonFeed.length).toBeGreaterThan(0)
      expect(out.rss.startsWith('<?xml')).toBe(true)
    })
  })

  describe('RSS 2.0 round-trip via fast-xml-parser', () => {
    it('round-trips entry fields losslessly', () => {
      const { rss } = serializeFeed([baseEntry], baseOpts)
      const tree = parser.parse(rss) as {
        rss: {
          channel: {
            title: string
            'atom:link': { '@href': string }
            item: {
              title: string
              link: string
              guid: { '#text': string; '@isPermaLink': string }
              pubDate: string
              description: string
              category: string
            }
          }
        }
      }
      const item = tree.rss.channel.item
      expect(item.title).toBe(baseEntry.title)
      expect(item.link).toBe(baseEntry.permalink)
      expect(item.guid['#text']).toBe(baseEntry.id)
      expect(item.guid['@isPermaLink']).toBe('false')
      expect(item.description).toBe(baseEntry.description)
      expect(item.category).toBe(baseEntry.category)
      expect(tree.rss.channel['atom:link']['@href']).toBe(`${baseOpts.feedUrl}.xml`)
      expect(item.pubDate).toBe(new Date(baseEntry.publishedAt).toUTCString())
    })

    it('emits channel-level title, link, description, language', () => {
      const { rss } = serializeFeed([baseEntry], baseOpts)
      const tree = parser.parse(rss) as {
        rss: {
          channel: {
            title: string
            link: string
            description: string
            language: string
          }
        }
      }
      expect(tree.rss.channel.title).toBe(baseOpts.title)
      expect(tree.rss.channel.link).toBe(baseOpts.siteUrl)
      expect(tree.rss.channel.description).toBe(baseOpts.description)
      expect(tree.rss.channel.language).toBe(baseOpts.language)
    })

    it('produces a valid empty feed for entries: []', () => {
      const { rss } = serializeFeed([], baseOpts)
      expect(() => parser.parse(rss)).not.toThrow()
      const tree = parser.parse(rss) as { rss: { channel: { title: string } } }
      expect(tree.rss).toBeDefined()
      expect(tree.rss.channel.title).toBe(baseOpts.title)
    })

    it('emits a copyright element when opts.copyright is set', () => {
      const { rss } = serializeFeed([baseEntry], { ...baseOpts, copyright: '© 2026 Acme' })
      const tree = parser.parse(rss) as { rss: { channel: { copyright: string } } }
      expect(tree.rss.channel.copyright).toBe('© 2026 Acme')
    })

    it('omits category element when entry.category is absent', () => {
      const { rss } = serializeFeed([{ ...baseEntry, category: undefined }], baseOpts)
      const tree = parser.parse(rss) as {
        rss: { channel: { item: { category?: string } } }
      }
      expect(tree.rss.channel.item.category).toBeUndefined()
    })
  })

  describe('JSON Feed 1.1 schema validation', () => {
    it('validates against the offline 1.1 schema', () => {
      const { jsonFeed } = serializeFeed([baseEntry], baseOpts)
      const parsed = JSON.parse(jsonFeed) as Record<string, unknown>
      const ajv = new Ajv({ allErrors: true })
      const validate = ajv.compile(schema)
      const valid = validate(parsed)
      if (!valid) {
        expect.fail(`Schema validation failed:\n${JSON.stringify(validate.errors, null, 2)}`)
      }
      expect(parsed.version).toBe('https://jsonfeed.org/version/1.1')
    })

    it('emits expected JSON Feed shape for one entry', () => {
      const { jsonFeed } = serializeFeed([baseEntry], baseOpts)
      const parsed = JSON.parse(jsonFeed) as {
        version: string
        title: string
        description: string
        home_page_url: string
        feed_url: string
        language: string
        items: Array<{
          id: string
          url: string
          title: string
          content_text: string
          date_published: string
          tags: string[]
        }>
      }
      expect(parsed.version).toBe('https://jsonfeed.org/version/1.1')
      expect(parsed.title).toBe(baseOpts.title)
      expect(parsed.description).toBe(baseOpts.description)
      expect(parsed.home_page_url).toBe(baseOpts.siteUrl)
      expect(parsed.feed_url).toBe(`${baseOpts.feedUrl}.json`)
      expect(parsed.language).toBe(baseOpts.language)
      expect(parsed.items).toHaveLength(1)
      const [item] = parsed.items
      if (!item) throw new Error('expected first item to exist')
      expect(item.id).toBe(baseEntry.id)
      expect(item.url).toBe(baseEntry.permalink)
      expect(item.title).toBe(baseEntry.title)
      expect(item.content_text).toBe(baseEntry.description)
      expect(item.date_published).toBe(new Date(baseEntry.publishedAt).toISOString())
      expect(item.tags).toEqual([baseEntry.category])
    })

    it('produces a valid empty feed for entries: []', () => {
      const { jsonFeed } = serializeFeed([], baseOpts)
      const parsed = JSON.parse(jsonFeed) as { items: unknown[] }
      const ajv = new Ajv({ allErrors: true })
      const validate = ajv.compile(schema)
      expect(validate(parsed)).toBe(true)
      expect(parsed.items).toEqual([])
    })
  })

  describe('adversarial input', () => {
    it('escapes XSS payloads in entry fields', () => {
      const { rss, jsonFeed } = serializeFeed([ADVERSARIAL_ENTRY], ADVERSARIAL_OPTS)

      // RSS — entities escaped
      expect(rss).toContain('&lt;script&gt;')
      expect(rss).toContain('&amp;')
      expect(rss).toContain('&quot;')
      expect(rss).toContain(']]&gt;')

      // RSS — no raw payloads
      expect(rss).not.toContain('<script>')
      expect(rss).not.toContain('<![CDATA[')
      expect(rss).not.toMatch(/]]>/)

      // JSON Feed — title preserved literally (JSON.stringify handles its own escaping)
      const parsed = JSON.parse(jsonFeed) as { items: Array<{ title: string }> }
      expect(parsed.items[0]?.title).toBe(ADVERSARIAL_ENTRY.title)
    })

    it('escapes XSS payloads in option fields (title, description, feedUrl, copyright, language, siteUrl)', () => {
      const { rss } = serializeFeed([], ADVERSARIAL_OPTS)
      expect(rss).toContain('&lt;script&gt;')
      expect(rss).toContain('&amp;')
      expect(rss).toContain('&quot;')
      expect(rss).toContain(']]&gt;')
      expect(rss).not.toContain('<script>')
      expect(rss).not.toContain('alert("opts")')
      expect(rss).not.toMatch(/]]>/)
    })

    it('round-trips an adversarial entry through fast-xml-parser without loss', () => {
      const { rss } = serializeFeed([ADVERSARIAL_ENTRY], ADVERSARIAL_OPTS)
      const tree = parser.parse(rss) as {
        rss: { channel: { item: { title: string; description: string; category: string } } }
      }
      const item = tree.rss.channel.item
      expect(item.title).toBe(ADVERSARIAL_ENTRY.title)
      expect(item.description).toBe(ADVERSARIAL_ENTRY.description)
      expect(item.category).toBe(ADVERSARIAL_ENTRY.category)
    })

    it('round-trips an adversarial JSON Feed without loss', () => {
      const { jsonFeed } = serializeFeed([ADVERSARIAL_ENTRY], ADVERSARIAL_OPTS)
      const parsed = JSON.parse(jsonFeed) as {
        items: Array<{ title: string; content_text: string; tags: string[] }>
      }
      const [item] = parsed.items
      if (!item) throw new Error('expected first item to exist')
      expect(item.title).toBe(ADVERSARIAL_ENTRY.title)
      expect(item.content_text).toBe(ADVERSARIAL_ENTRY.description)
      expect(item.tags).toEqual([ADVERSARIAL_ENTRY.category])
    })
  })

  describe('validateDate fail-fast on invalid input', () => {
    it('throws TypeError for a non-date string', () => {
      const bad: ChangelogEntry = { ...baseEntry, publishedAt: 'not-a-date' }
      expect(() => serializeFeed([bad], baseOpts)).toThrow(TypeError)
    })

    it('throws TypeError for an explicitly invalid Date', () => {
      const bad: ChangelogEntry = { ...baseEntry, publishedAt: new Date('garbage') }
      expect(() => serializeFeed([bad], baseOpts)).toThrow(TypeError)
    })

    it('throws TypeError for empty string', () => {
      const bad: ChangelogEntry = { ...baseEntry, publishedAt: '' }
      expect(() => serializeFeed([bad], baseOpts)).toThrow(TypeError)
    })

    it('error message includes the entry id for diagnostics', () => {
      const bad: ChangelogEntry = { ...baseEntry, id: 'evil-id', publishedAt: 'not-a-date' }
      expect(() => serializeFeed([bad], baseOpts)).toThrow(/evil-id/)
    })

    it('accepts valid Date objects', () => {
      const ok: ChangelogEntry = { ...baseEntry, publishedAt: new Date('2026-01-01') }
      expect(() => serializeFeed([ok], baseOpts)).not.toThrow()
    })

    it('accepts valid ISO strings', () => {
      const ok: ChangelogEntry = { ...baseEntry, publishedAt: '2026-01-01T00:00:00Z' }
      expect(() => serializeFeed([ok], baseOpts)).not.toThrow()
    })
  })

  describe('GUID stability', () => {
    it('emits guid[@isPermaLink="false"] for every item', () => {
      const entries: ChangelogEntry[] = [
        { ...baseEntry, id: 'a' },
        { ...baseEntry, id: 'b' },
        { ...baseEntry, id: 'c' },
      ]
      const { rss } = serializeFeed(entries, baseOpts)
      const tree = parser.parse(rss) as {
        rss: {
          channel: {
            item: Array<{ guid: { '#text': string; '@isPermaLink': string } }>
          }
        }
      }
      const items = Array.isArray(tree.rss.channel.item)
        ? tree.rss.channel.item
        : [tree.rss.channel.item]
      expect(items).toHaveLength(3)
      for (const item of items) {
        expect(item.guid['@isPermaLink']).toBe('false')
      }
      expect(items.map((i) => i.guid['#text'])).toEqual(['a', 'b', 'c'])
    })
  })

  describe('non-string title/description (ReactNode branch)', () => {
    it('emits empty title in RSS when entry.title is non-string', () => {
      // Cast bypasses the type system to simulate a ReactNode title — this
      // happens in practice when consumers reuse an in-app announcement
      // config that carried a JSX body.
      const entry: ChangelogEntry = {
        ...baseEntry,
        title: { type: 'div', props: { children: 'jsx' }, key: null } as unknown as string,
        description: { type: 'div', props: {}, key: null } as unknown as string,
      }
      const { rss, jsonFeed } = serializeFeed([entry], baseOpts)
      const tree = parser.parse(rss) as {
        rss: { channel: { item: { title: string | undefined; description: string | undefined } } }
      }
      // Self-closing empty tags parse as undefined / empty
      expect(tree.rss.channel.item.title === undefined || tree.rss.channel.item.title === '').toBe(
        true
      )
      const parsed = JSON.parse(jsonFeed) as {
        items: Array<{ title?: string; content_text?: string }>
      }
      expect(parsed.items[0]?.title).toBeUndefined()
      expect(parsed.items[0]?.content_text).toBeUndefined()
    })
  })

  describe('default language', () => {
    it('falls back to "en" when opts.language is omitted', () => {
      const { rss, jsonFeed } = serializeFeed([baseEntry], {
        title: 'X',
        description: 'D',
        siteUrl: 'https://x',
        feedUrl: 'https://x/feed',
      })
      const tree = parser.parse(rss) as { rss: { channel: { language: string } } }
      expect(tree.rss.channel.language).toBe('en')
      const parsed = JSON.parse(jsonFeed) as { language: string }
      expect(parsed.language).toBe('en')
    })
  })

  describe('contentHtml emission', () => {
    it('emits content_html in JSON Feed when present', () => {
      const entry: ChangelogEntry = { ...baseEntry, contentHtml: '<p>hi</p>' }
      const { jsonFeed } = serializeFeed([entry], baseOpts)
      const parsed = JSON.parse(jsonFeed) as { items: Array<{ content_html?: string }> }
      expect(parsed.items[0]?.content_html).toBe('<p>hi</p>')
    })

    it('does NOT emit raw HTML in RSS description', () => {
      const entry: ChangelogEntry = {
        ...baseEntry,
        description: '<p>hi</p>',
        contentHtml: '<p>hi</p>',
      }
      const { rss } = serializeFeed([entry], baseOpts)
      expect(rss).not.toContain('<p>hi</p>')
      expect(rss).toContain('&lt;p&gt;hi&lt;/p&gt;')
    })
  })
})
