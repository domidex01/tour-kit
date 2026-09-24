import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'
import { budgets } from '../../../../tooling/bundle-check/budgets.mjs'

const DOCS = path.resolve(__dirname, '../..')

/**
 * Which gate row backs each package word the marketing copy uses. A claim is
 * allowed to quote the *ceiling* the merge gate enforces, never a number
 * nothing measures — that is how `<8KB` survived in 571 places while the build
 * printed 22 923.
 */
const ROW: Record<string, string> = {
  core: 'core',
  react: 'react',
  hints: 'hints',
  checklists: 'checklists',
  announcements: 'announcements',
  surveys: 'surveys',
  adoption: 'adoption',
  media: 'media',
  analytics: 'analytics:main',
  scheduling: 'scheduling',
  license: 'license',
}

/**
 * Files whose premise is the number, so renumbering them leaves an argument
 * that no longer reaches its own conclusion. Each needs rewriting or retiring
 * rather than a find-and-replace. Listed so the debt is visible, not silent.
 *
 * - `tour-kit-8kb-zero-dependencies` carries 8KB in its title, slug and OG image.
 * - `lightweight-product-tour-libraries-under-10kb` is a roundup of sub-10KB
 *   libraries that names Tour Kit as "the only sub-10KB" one. At 23KB it no
 *   longer qualifies for its own list, so the fix is dropping it from the
 *   roundup or reframing the threshold — not restating it as sub-23KB inside an
 *   article about 10KB.
 */
const AWAITING_REWRITE = new Set([
  'tour-kit-8kb-zero-dependencies.mdx',
  'lightweight-product-tour-libraries-under-10kb.mdx',
])

const budgetKb = (pkg: string): number | undefined => {
  const row = budgets.find((b: [string, string, number]) => b[0] === ROW[pkg])
  return row ? row[2] / 1000 : undefined
}

function mdxFiles(dir: string, out: string[] = []): string[] {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, e.name)
    if (e.isDirectory()) mdxFiles(full, out)
    else if (e.name.endsWith('.mdx')) out.push(full)
  }
  return out
}

// `react` is deliberately absent as a bare word: "React 19", "@react-aria/*"
// and "React Aria Tooltip" all precede sizes that are not ours, and policing it
// flagged Zustand's 1.2KB and react-aria's 8kB as our claims. The React package
// is policed through its scoped name only.
const BARE =
  'core|hints|checklists|announcements|surveys|adoption|media|analytics|scheduling|license'
// `(?!\.js)` keeps "Analytics.js 2.0 loads about 16KB" — Segment's SDK — from
// reading as a claim about `@tour-kit/analytics`.
const PKG = String.raw`(?:@tour-kit\/(react|${BARE})|\b(${BARE})\b(?!\.js))`
const SIZE = String.raw`(?:<|under\s+|about\s+|sub-|&lt;|~)\s*(\d{1,3}(?:\.\d)?)\s*k[Bb]`
const GAP = String.raw`[^.\n|]{0,40}?`

const FORWARD = new RegExp(`${PKG}${GAP}${SIZE}`, 'gi') // 1,2 = pkg · 3 = size

/**
 * The size-first order, deliberately narrow. "Sub-23KB gzipped footprint for
 * the entire analytics layer" shipped green against a 4KB gate because the
 * forward pattern never reached it — but a general size-then-package scan is
 * not the fix. In that order the size is anchored to whatever was named before
 * it, so "Driver.js at ~5KB and userTourKit core at under 23KB" reads as a 5KB
 * claim about our core, and "add Plausible as a ~1 KB tracking layer" as a 1KB
 * claim about our analytics package. Both are other people's numbers.
 *
 * So this matches only the idiom we write about ourselves: a `sub-N KB` feature
 * bullet closed by a product noun. Competitors are cited as `~N KB` or `at
 * N KB`, never `sub-`, which is what keeps the two apart without a name list.
 */
const REVERSE = new RegExp(
  String.raw`(?:sub-|&lt;|<)\s*(\d{1,3}(?:\.\d)?)\s*k[Bb]${GAP}${PKG}\s+(?:package|layer|bundle|core)`,
  'gi'
) // 1 = size · 2,3 = pkg

/**
 * A competitor named immediately before the package word owns the size:
 * "Driver.js's core is under 5KB" is their fact, and flagging it would name the
 * wrong owner in the failure message. A competitor named elsewhere in the same
 * sentence does not — "our core is under 23KB, React Joyride weighs 37KB" is
 * precisely the comparison this guard exists to keep honest, so the lookbehind
 * window is deliberately narrow rather than sentence-wide.
 */
const RIVALS = String.raw`React Joyride|Joyride|Driver\.js|Shepherd(?:\.js)?|Reactour|Intro\.js|Onborda|OnboardJS|Usertour|Userpilot|Appcues|Pendo|Chameleon|WalkMe|UserGuiding|Userflow|Whatfix|Intercom|TanStack|Zustand|Redux(?: Toolkit)?|Jotai|DOMPurify|Segment|Mixpanel|Statsig|Plausible|OpenTelemetry|Analytics\.js`
const COMPETITOR_OWNER = new RegExp(`(?:${RIVALS})(?:'s|’s)?\\s+$`, 'i')
const RIVAL_ANYWHERE = new RegExp(RIVALS, 'i')

/**
 * The brand, then a size, with no package word between them: "Tour Kit is
 * headless (under 12KB gzipped)" is a claim about `core` that neither of the
 * patterns above can see, because they both need a package word to anchor on.
 * The brand is a stronger ownership signal than the bare word `core` ever was,
 * so this is safe — provided no rival is named inside the span, which is what
 * separates it from "Tour Kit works with Zustand at 1.1KB".
 */
const BRAND = new RegExp(String.raw`(?:userTourKit|Tour Kit)${GAP}${SIZE}`, 'gi') // 1 = size

function scan(text: string, file: string, offenders: string[]): void {
  const report = (pkg: string | undefined, claimed: number) => {
    if (!pkg) return
    const ceiling = budgetKb(pkg)
    if (ceiling !== undefined && claimed < ceiling) {
      offenders.push(`${file}: claims ${pkg} <${claimed}KB, gate enforces ${ceiling}KB`)
    }
  }

  for (const [re, pkgAt, sizeAt] of [
    [FORWARD, 1, 3],
    [REVERSE, 2, 1],
  ] as const) {
    for (const m of text.matchAll(re)) {
      if (COMPETITOR_OWNER.test(text.slice(Math.max(0, m.index - 32), m.index))) continue
      report((m[pkgAt] ?? m[pkgAt + 1])?.toLowerCase(), Number(m[sizeAt]))
    }
  }

  const NAMES = new RegExp(`\\b(?:${BARE}|react)\\b`, 'i')
  for (const m of text.matchAll(BRAND)) {
    // A package word anywhere near the match means some other row owns it, and
    // defaulting to `core` would report the wrong budget. Two shapes matter:
    // the word inside the span, which FORWARD already reports (double-count),
    // and the word trailing the size — "Bundle size (Tour Kit) | &lt;6.5KB
    // gzipped (@tourkit/hints)" is a hints claim even though "hints" arrives
    // after the number. `react` counts here too: its ceiling really is 12KB,
    // so attributing "@tourkit/react (under 12KB)" to core's 23KB would report
    // a passing claim as an offender.
    const window = m[0] + text.slice(m.index + m[0].length, m.index + m[0].length + 30)
    if (RIVAL_ANYWHERE.test(window) || NAMES.test(window)) continue
    report('core', Number(m[1]))
  }
}

describe('bundle-size claims', () => {
  it('never claims a size smaller than the gate enforces', () => {
    const offenders: string[] = []
    const files = [...mdxFiles(path.join(DOCS, 'content')), path.join(DOCS, 'lib/comparisons.ts')]

    for (const file of files) {
      if (AWAITING_REWRITE.has(path.basename(file))) continue
      scan(readFileSync(file, 'utf8'), path.relative(DOCS, file), offenders)
    }

    expect(offenders).toEqual([])
  })

  it('has a budget row for every package word it polices', () => {
    for (const pkg of Object.keys(ROW)) {
      expect(budgetKb(pkg), `no budget row for ${pkg}`).toBeTypeOf('number')
    }
  })

  it('reads all three shapes a claim gets written in', () => {
    // Without this the suite passes on a corpus it is only half-reading.
    for (const line of [
      'Tour Kit core ships at under 9KB gzipped.', // package word, then size
      'Sub-9KB gzipped footprint for the core package.', // size, then package word
      'Tour Kit is headless (under 9KB gzipped).', // brand and size, no package word
    ]) {
      const found: string[] = []
      scan(line, 'shape', found)
      expect(found, line).toHaveLength(1)
    }
  })

  it('leaves other libraries their own numbers', () => {
    // Every line here was a live false positive while the size-first pattern
    // was a general scan. They are the reason it is narrow.
    const theirs: string[] = []
    for (const line of [
      "Driver.js's core is under 5KB gzipped.",
      'Driver.js at ~5KB and userTourKit core at under 23KB are the lightweights.',
      "You'll add Plausible as a ~1 KB tracking layer on top of your analytics setup.",
      'Analytics.js 2.0 loads about 16KB gzipped initially.',
      // ours, but hints' row, not core's — the package word trails the size
      '<td>Bundle size (Tour Kit)</td><td>&lt;6.5KB gzipped (@tourkit/hints)</td>',
    ]) {
      scan(line, 'theirs', theirs)
    }
    expect(theirs).toEqual([])
  })
})
