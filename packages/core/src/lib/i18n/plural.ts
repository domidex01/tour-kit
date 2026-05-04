/**
 * ICU subset plural resolver. Recognizes:
 *
 *   {<varName>, plural, =N {literal} one {…} few {…} many {…} other {…}}
 *
 * Backed by `Intl.PluralRules` (validation log: 95.67% global support).
 * `=N` exact matches take precedence over plural categories. `#` inside the
 * chosen branch is replaced with the stringified count value (ICU convention).
 *
 * Falls through to the original template when the count is not a number, no
 * branch matches, or the block is malformed — leaving `interpolate` to handle it.
 */

const pluralRulesCache = new Map<string, Intl.PluralRules>()

function getPluralRules(locale: string): Intl.PluralRules {
  let rules = pluralRulesCache.get(locale)
  if (!rules) {
    try {
      rules = new Intl.PluralRules(locale)
    } catch {
      rules = new Intl.PluralRules('en')
    }
    pluralRulesCache.set(locale, rules)
  }
  return rules
}

// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: ICU subset scanner — brace-depth state machine + plural category lookup
export function resolvePlural(
  template: string,
  locale: string,
  vars: Record<string, unknown> | undefined
): string {
  // Cheap reject — most templates have no plural marker
  if (!template.includes(', plural,')) return template

  let result = ''
  let i = 0
  while (i < template.length) {
    const ch = template[i]
    if (ch !== '{') {
      result += ch
      i++
      continue
    }

    // Find matching close brace via depth counting (handles nested {{var}} tokens)
    const blockStart = i
    let depth = 1
    let j = i + 1
    while (j < template.length && depth > 0) {
      const c = template[j]
      if (c === '{') depth++
      else if (c === '}') depth--
      j++
    }

    if (depth !== 0) {
      // Unmatched brace — bail and emit the rest verbatim for downstream handling
      result += template.slice(blockStart)
      break
    }

    const blockEnd = j
    const blockBody = template.slice(blockStart + 1, blockEnd - 1)

    // Match `<varName>, plural, <body>` — anything else is a passthrough
    const headerMatch = /^\s*([^\s,{}]+)\s*,\s*plural\s*,\s*([\s\S]*)$/.exec(blockBody)
    if (!headerMatch) {
      // Not a plural block — emit original including outer braces
      result += template.slice(blockStart, blockEnd)
      i = blockEnd
      continue
    }

    const varName = headerMatch[1] ?? ''
    const body = headerMatch[2] ?? ''
    const rawCount = vars?.[varName]
    const count = typeof rawCount === 'number' ? rawCount : Number(rawCount)

    if (typeof rawCount !== 'number' && !Number.isFinite(count)) {
      // Not numeric — fall back to "other" or emit original
      const otherBranch = findPluralBranch(body, 'other')
      result += otherBranch ?? template.slice(blockStart, blockEnd)
      i = blockEnd
      continue
    }

    // Try `=N` exact match first
    const exactBranch = findPluralBranch(body, `=${count}`)
    if (exactBranch !== null) {
      result += exactBranch.replace(/#/g, String(count))
      i = blockEnd
      continue
    }

    // Try plural category from Intl.PluralRules
    const category = getPluralRules(locale).select(count)
    const catBranch = findPluralBranch(body, category)
    if (catBranch !== null) {
      result += catBranch.replace(/#/g, String(count))
      i = blockEnd
      continue
    }

    // Final fallback — `other`
    const otherBranch = findPluralBranch(body, 'other')
    if (otherBranch !== null) {
      result += otherBranch.replace(/#/g, String(count))
      i = blockEnd
      continue
    }

    // Nothing matched — emit original block unchanged
    result += template.slice(blockStart, blockEnd)
    i = blockEnd
  }

  return result
}

/**
 * Walks a plural body looking for `<category> {<text>}` and returns the matching
 * branch text. Brace depth is tracked so nested `{{var}}` interpolation tokens
 * inside a branch don't terminate the search prematurely.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: brace-depth scanner with state machine
function findPluralBranch(body: string, category: string): string | null {
  let i = 0
  while (i < body.length) {
    while (i < body.length && /\s/.test(body[i] ?? '')) i++
    if (i >= body.length) break

    const nameStart = i
    while (i < body.length && body[i] !== '{' && !/\s/.test(body[i] ?? '')) i++
    const name = body.slice(nameStart, i)
    if (!name) break

    while (i < body.length && /\s/.test(body[i] ?? '')) i++
    if (body[i] !== '{') return null

    let depth = 1
    let j = i + 1
    while (j < body.length && depth > 0) {
      const c = body[j]
      if (c === '{') depth++
      else if (c === '}') depth--
      j++
    }
    if (depth !== 0) return null

    const text = body.slice(i + 1, j - 1)
    if (name === category) return text
    i = j
  }
  return null
}
