import { execSync } from 'node:child_process'

const SITE_LAUNCH_FALLBACK = '2025-01-01T00:00:00.000Z'

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
    return result ? new Date(result) : new Date(SITE_LAUNCH_FALLBACK)
  } catch {
    return new Date(SITE_LAUNCH_FALLBACK)
  }
}
