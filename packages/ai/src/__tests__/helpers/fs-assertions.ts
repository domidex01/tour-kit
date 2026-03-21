import { existsSync } from 'node:fs'
import { resolve } from 'node:path'

const DIST_DIR = resolve(__dirname, '../../../dist')

export function distPath(...segments: string[]): string {
  return resolve(DIST_DIR, ...segments)
}

export function assertDistFileExists(relativePath: string): void {
  const fullPath = distPath(relativePath)
  if (!existsSync(fullPath)) {
    throw new Error(`Expected dist file not found: ${relativePath} (resolved: ${fullPath})`)
  }
}
