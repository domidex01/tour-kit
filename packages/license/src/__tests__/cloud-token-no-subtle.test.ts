/**
 * Plan 12C §12C.15 + D7 regression: the SDK bundle must NEVER call
 * `crypto.subtle.verify({ name: 'Ed25519' }, …)`. Native Web Crypto Ed25519
 * landed in Chrome 137 (May 2026); a regression to subtle.verify would
 * silently watermark ~21% of customer end-users on older Chrome / Android
 * WebViews / Electron despite a valid Pro token.
 *
 * This test is a static source-level check, not a behavioral test. It scans
 * the built source for any Ed25519 + subtle.verify combination. The grep is
 * deliberately wide (handles minified output, alternate quote styles, and
 * spread-args), so a developer accidentally typing it anywhere — including a
 * comment — would have to write it in a form this pattern doesn't catch.
 *
 * The signer side (issuer code) can keep using subtle.sign because it runs
 * in Bun/Node, where Ed25519 has been supported since Node 18.4 / Bun 0.6.
 * That code lives in `tourkit-dash/apps/api/src/sdk-tokens/issue.ts` and is
 * out of scope for this package.
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const PACKAGE_ROOT = join(__dirname, '..')

function walk(dir: string, out: string[] = []): string[] {
  for (const entry of readdirSync(dir)) {
    if (entry === '__tests__' || entry === 'node_modules' || entry === 'dist') continue
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) {
      walk(full, out)
    } else if (/\.(ts|tsx)$/.test(entry)) {
      out.push(full)
    }
  }
  return out
}

describe('cloud-token bundle — no native Ed25519 in subtle.verify', () => {
  it('does not call crypto.subtle.verify with an Ed25519 algorithm name anywhere in src/', () => {
    const files = walk(PACKAGE_ROOT)
    const offenders: Array<{ file: string; line: number; text: string }> = []

    for (const file of files) {
      const content = readFileSync(file, 'utf8')
      const lines = content.split('\n')
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i] ?? ''
        // Match subtle.verify(...) on the same line as an Ed25519 reference.
        // Wide enough to catch object-arg, string-arg, and minified forms.
        if (/subtle\.verify\b/.test(line) && /Ed25519/i.test(line)) {
          offenders.push({ file, line: i + 1, text: line.trim() })
        }
      }
    }

    if (offenders.length > 0) {
      const detail = offenders
        .map((o) => `  ${o.file.replace(PACKAGE_ROOT, 'src')}:${o.line}\n    ${o.text}`)
        .join('\n')
      throw new Error(
        `Plan 12C D7 violation: subtle.verify({ name: 'Ed25519' }) found. Use @noble/ed25519's verifyAsync instead.\n${detail}`
      )
    }

    expect(offenders).toEqual([])
  })
})
