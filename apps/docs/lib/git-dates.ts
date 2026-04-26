import { execSync } from 'node:child_process'

/**
 * Build-time fallback. Today's date prevents broadcasting an identical sentinel
 * across many URLs, which Google flags as fabricated and ignores wholesale.
 */
export const SITE_LAUNCH_FALLBACK = new Date().toISOString()

export function getGitLastModified(filePath: string): Date {
  try {
    const result = execSync(`git log -1 --format=%cI -- "${filePath}"`, {
      encoding: 'utf-8',
    }).trim()
    return result ? new Date(result) : new Date()
  } catch {
    return new Date()
  }
}

export function getGitFirstCommitted(filePath: string): Date {
  try {
    const result = execSync(`git log --diff-filter=A --follow --format=%aI -- "${filePath}"`, {
      encoding: 'utf-8',
    })
      .trim()
      .split('\n')
      .pop()
    return result ? new Date(result) : new Date()
  } catch {
    return new Date()
  }
}
