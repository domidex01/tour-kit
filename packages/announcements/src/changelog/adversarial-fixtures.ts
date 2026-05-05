import type { ChangelogEntry, SerializeFeedOptions } from './feed'

/**
 * Hand-picked adversarial publisher options.
 *
 * Every consumer-supplied option string flows through `escapeXml` before
 * landing in XML. The combined payload (`<script>`, raw `&`, raw `"`,
 * literal `]]>`, control chars) exists to enforce that contract — every
 * field, no exceptions.
 */
export const ADVERSARIAL_OPTS: SerializeFeedOptions = {
  title: 'Title with <script>alert("opts")</script> & "quotes"',
  description: 'Desc with ]]> and CDATA-like text',
  siteUrl: 'https://x.test/?a=1&b=2',
  feedUrl: 'https://x.test/feed?token="abc"',
  language: 'en-"GB"',
  copyright: 'Copyright © 2026 with  ctrl chars',
}

/**
 * Hand-picked adversarial entry.
 *
 * Includes XSS-style payloads (`<script>`, `<![CDATA[evil]]>`), raw
 * ampersands in URL query strings, and a category containing `&` so the
 * `<category>` element exercises entity escaping too.
 */
export const ADVERSARIAL_ENTRY: ChangelogEntry = {
  id: 'evil-entry-1',
  variant: 'modal',
  title: 'Hello <script>alert(1)</script> & "you"',
  description: '<![CDATA[evil]]>',
  permalink: 'https://x.test/?a=1&b=2',
  publishedAt: new Date('2026-05-04T00:00:00Z'),
  category: 'feature & support',
}
