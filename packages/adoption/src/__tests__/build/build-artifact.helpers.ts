import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { gzipSync } from 'node:zlib'

// __dirname here is .../packages/adoption/src/__tests__/build
// dist lives at .../packages/adoption/dist/index.js
export const distPath = join(__dirname, '..', '..', '..', 'dist', 'index.js')

export function readDistOrSkip(): string | null {
  if (!existsSync(distPath)) return null
  return readFileSync(distPath, 'utf8')
}

/**
 * Heuristic: a tsup-minified bundle collapses most code onto a single line.
 * Pre-Phase-1-Task-1.6 (minify: false) the adoption bundle is ~1500 lines;
 * with minify: true it drops to under 50. Threshold 200 is well clear of both.
 */
export function looksMinified(content: string | null): boolean {
  if (content === null) return false
  return content.split('\n').length < 200
}

export function gzippedBytes(content: string): number {
  return gzipSync(content).length
}
