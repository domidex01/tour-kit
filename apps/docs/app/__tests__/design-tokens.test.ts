import { readFileSync, readdirSync } from 'node:fs'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

/**
 * The design tokens are the whole redesign's load-bearing surface: every page,
 * including the ~25 Fumadocs routes nobody hand-styles, reads its colour from
 * the `--color-fd-*` block in globals.css. These tests pin the two things that
 * are easy to break by eye and impossible to spot in review.
 *
 * 1. Contrast. The Figma mockup (file 6VwCdAiNHSTOHaOWOB0Zmo, frame 3945:1460)
 *    fills the primary button with indigo-400 and puts white on it — that
 *    measures 3.1:1 and fails AA for a 14px label. The token layer deliberately
 *    deviates: indigo-400 stays the brand *ink* (links, accents) where it reads
 *    at 6.5:1 on the dark ground, and the CTA *fill* steps down to indigo-500 so
 *    white clears 4.5:1. Anyone "fixing" the tokens back to match the mockup
 *    pixel-for-pixel should fail here and read this comment.
 *
 * 2. The retired palette. The old system ran two competing blues (#0197f6 for
 *    landing, #0056ff for Fumadocs) as intentional raw hex. The redesign
 *    collapses both into one indigo token, so the hex must not creep back.
 */

const DOCS_ROOT = path.resolve(__dirname, '../..')
const CSS = readFileSync(path.join(DOCS_ROOT, 'app/globals.css'), 'utf8')

/** Relative luminance per WCAG 2.1 §relative-luminance. */
function luminance(hex: string): number {
  const h = hex.replace('#', '')
  const channels = [0, 2, 4].map((i) => Number.parseInt(h.slice(i, i + 2), 16) / 255)
  const [r, g, b] = channels.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4))
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** Contrast ratio per WCAG 2.1 §contrast-ratio. */
function contrast(fg: string, bg: string): number {
  const [lo, hi] = [luminance(fg), luminance(bg)].sort((a, b) => a - b)
  return (hi + 0.05) / (lo + 0.05)
}

/**
 * Pulls one flat `selector { ... }` declaration block out of globals.css.
 * `:root` appears more than once (the base tokens, and a `--fd-layout-width`
 * override under @layer utilities), so callers disambiguate with `mustContain`.
 */
function tokensIn(selector: string, mustContain: string): Record<string, string> {
  const blocks = [...CSS.matchAll(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, 'g'))]
    .map((m) => m[1])
    .filter((body) => body.includes(mustContain))
  expect(blocks, `no ${selector} block containing ${mustContain}`).toHaveLength(1)

  const tokens: Record<string, string> = {}
  for (const [, name, value] of blocks[0].matchAll(/(--[\w-]+)\s*:\s*([^;]+);/g)) {
    tokens[name] = value.trim()
  }
  return tokens
}

const light = tokensIn(':root', '--color-fd-background')
const dark = tokensIn('\\.dark', '--color-fd-background')

/** WCAG AA: 4.5:1 for body text, 3:1 for UI component boundaries. */
const AA_TEXT = 4.5
const AA_NON_TEXT = 3

describe.each([
  ['light', light],
  ['dark', dark],
])('%s theme', (_themeName, t) => {
  it('declares the full semantic token set', () => {
    // A token missing from one theme renders as an inherited value from the
    // other — which looks fine in whichever theme you happened to test.
    const required = [
      '--color-fd-background',
      '--color-fd-foreground',
      '--color-fd-muted',
      '--color-fd-muted-foreground',
      '--color-fd-card',
      '--color-fd-card-foreground',
      '--color-fd-popover',
      '--color-fd-popover-foreground',
      '--color-fd-border',
      '--color-fd-ring',
      '--color-fd-primary',
      '--color-fd-primary-foreground',
      '--color-fd-secondary',
      '--color-fd-secondary-foreground',
      '--color-fd-accent',
      '--color-fd-accent-foreground',
      '--color-fd-destructive',
      '--color-fd-destructive-foreground',
      '--tk-hairline',
      '--tk-cta',
      '--tk-cta-ink',
      '--landing-accent',
    ]
    expect(Object.keys(t)).toEqual(expect.arrayContaining(required))
  })

  it.each([
    ['body text on the page ground', '--color-fd-foreground', '--color-fd-background'],
    ['secondary copy on the page ground', '--color-fd-muted-foreground', '--color-fd-background'],
    ['secondary copy on a muted band', '--color-fd-muted-foreground', '--color-fd-muted'],
    ['card text on a card', '--color-fd-card-foreground', '--color-fd-card'],
    ['popover text on a popover', '--color-fd-popover-foreground', '--color-fd-popover'],
    ['a brand link on the page ground', '--color-fd-primary', '--color-fd-background'],
    ['ink on a brand fill', '--color-fd-primary-foreground', '--color-fd-primary'],
    ['the CTA label on the CTA fill', '--tk-cta-ink', '--tk-cta'],
    ['text on a secondary surface', '--color-fd-secondary-foreground', '--color-fd-secondary'],
    ['text on an accent surface', '--color-fd-accent-foreground', '--color-fd-accent'],
    ['text on a destructive fill', '--color-fd-destructive-foreground', '--color-fd-destructive'],
  ])('reaches AA for %s', (_label, fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(AA_TEXT)
  })

  it.each([
    ['a control edge', '--tk-hairline', '--color-fd-background'],
    ['the focus ring', '--color-fd-ring', '--color-fd-background'],
  ])('reaches AA non-text contrast for %s', (_label, fg, bg) => {
    expect(contrast(t[fg], t[bg])).toBeGreaterThanOrEqual(AA_NON_TEXT)
  })
})

describe('the retired brand palette', () => {
  it('is gone from the token layer', () => {
    // #0197f6 survives in exactly one place by design: the "ocean" swatch in
    // the tour-card theme presets, which is demo content showing what a
    // consumer can theme *their* tour to — not site chrome.
    // Comments are stripped first: the notes above the token block explain why
    // the old hex was retired and necessarily name it, which is documentation,
    // not a live declaration.
    const declarations = CSS.replace(/\/\*[\s\S]*?\*\//g, '')
    const split = declarations.indexOf('[data-tk-theme="ocean"]')
    const oceanPreset = declarations.slice(split)
    const chrome = declarations.slice(0, split)
    expect(chrome).not.toMatch(/#0197f6|#0056ff|#02182b|#edf6fb/i)
    expect(oceanPreset).toMatch(/#0197f6/i)
  })

  it('is gone from every component and route', () => {
    // readdirSync({ recursive }) rather than fs.globSync: CI pins Node 20,
    // where globSync does not exist and this would fail only on the runner.
    const files = ['app', 'components', 'lib'].flatMap((dir) =>
      readdirSync(path.join(DOCS_ROOT, dir), { recursive: true, encoding: 'utf8' })
        .filter((f) => /\.tsx?$/.test(f))
        .map((f) => path.join(dir, f))
    )
    expect(files.length).toBeGreaterThan(50) // guard against a silent empty scan

    const SELF = path.relative(DOCS_ROOT, __filename)
    const offenders = files.filter((f) => {
      // og-image.ts renders through Satori, outside the DOM, where a CSS custom
      // property never resolves — it tracks the palette in literal hex.
      if (f === 'lib/og-image.ts') return false
      // ...and this file necessarily spells the retired hex to search for it.
      if (f === SELF) return false
      return /#0197f6|#0056ff|#02182b|#edf6fb/i.test(readFileSync(path.join(DOCS_ROOT, f), 'utf8'))
    })
    expect(offenders).toEqual([])
  })
})
