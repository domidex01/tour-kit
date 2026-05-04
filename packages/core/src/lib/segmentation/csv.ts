/**
 * Parse a CSV string into a deduped array of trimmed user IDs.
 *
 * Spec (RFC 4180-lite — no nested CSV, no multi-line quoted fields):
 * - Strips a leading BOM (`﻿`).
 * - Splits on `\r\n` or `\n`. Empty lines are skipped (including a trailing one).
 * - Header detection: case-insensitive match on `id` / `user_id` / `userId`
 *   in the first column → drops that row. Otherwise treats the first row as data.
 * - Quote-aware first-column parser: `"u,1"` preserves the comma; doubled
 *   quotes `""` decode to a literal `"`.
 * - Multi-column rows: only the first column is taken.
 * - Result is trimmed and deduplicated, preserving first-seen order.
 *
 * Hand-rolled to keep `@tour-kit/core` under its 22.5 KB raw budget — adding
 * `papaparse` or `csv-parse` would bust the cap.
 *
 * @example
 *   parseUserIdsFromCsv('id\nu_1\nu_2')             // → ['u_1', 'u_2']
 *   parseUserIdsFromCsv('id\n"u,1"\nu_2')           // → ['u,1', 'u_2']
 *   parseUserIdsFromCsv('id,email\nu_1,a@b.com')    // → ['u_1']
 */
export function parseUserIdsFromCsv(csv: string): string[] {
  if (!csv) return []

  const src = csv.charCodeAt(0) === 0xfeff ? csv.slice(1) : csv
  const lines = src.split(/\r\n|\n/).filter((line) => line.length > 0)
  if (lines.length === 0) return []

  const startIdx = HEADER_RE.test(firstColumn(lines[0] ?? '')) ? 1 : 0

  const seen = new Set<string>()
  const out: string[] = []
  for (let i = startIdx; i < lines.length; i++) {
    const value = firstColumn(lines[i] ?? '')
    if (value && !seen.has(value)) {
      seen.add(value)
      out.push(value)
    }
  }
  return out
}

const HEADER_RE = /^(id|user_?id)$/i

function firstColumn(line: string): string {
  if (line[0] === '"') {
    let out = ''
    let i = 1
    while (i < line.length) {
      const ch = line[i]
      if (ch === '"' && line[i + 1] === '"') {
        out += '"'
        i += 2
        continue
      }
      if (ch === '"') break
      out += ch
      i++
    }
    return out.trim()
  }
  let out = ''
  let i = 0
  while (i < line.length && line[i] !== ',') {
    out += line[i]
    i++
  }
  return out.trim()
}
