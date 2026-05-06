import { execSync } from 'node:child_process'

/**
 * Hardcoded launch sentinel for trust pages and other pages with no
 * frontmatter and no real change history. Per-URL constants in callers
 * stop Google flagging a single broadcast date as fabricated.
 */
export const SITE_LAUNCH_FALLBACK = '2026-04-01T00:00:00.000Z'

/**
 * Last commit time for `filePath`, or null when git history isn't available
 * (shallow clones on Dokploy commonly lack the relevant commit). Callers MUST
 * decide the fallback — silently returning today's date pollutes sitemap
 * `lastmod` with the build timestamp, which Google ignores as a freshness
 * signal.
 */
export function getGitLastModified(filePath: string): Date | null {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim()
    if (!result) return null
    const parsed = new Date(result)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}

/**
 * First commit time for `filePath`, or null when git history isn't available.
 * Same contract as `getGitLastModified` — caller picks the fallback.
 */
export function getGitFirstCommitted(filePath: string): Date | null {
  try {
    const result = execSync(`git log --diff-filter=A --follow --format=%aI -- "${filePath}"`, {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .pop()
    if (!result) return null
    const parsed = new Date(result)
    return Number.isNaN(parsed.getTime()) ? null : parsed
  } catch {
    return null
  }
}
