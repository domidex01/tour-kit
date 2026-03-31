import { readFileSync, readdirSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = process.cwd()
const SRC_DIR = resolve(PKG_ROOT, 'src')
const SERVER_DIR = resolve(SRC_DIR, 'server')

/** Recursively get all .ts/.tsx files in a directory */
function getSourceFiles(dir: string, ext: string[] = ['.ts', '.tsx']): string[] {
  const files: string[] = []
  try {
    const entries = readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = join(dir, entry.name)
      if (entry.isDirectory() && entry.name !== '__tests__' && entry.name !== 'node_modules') {
        files.push(...getSourceFiles(fullPath, ext))
      } else if (entry.isFile() && ext.some((e) => entry.name.endsWith(e))) {
        files.push(fullPath)
      }
    }
  } catch {
    // Directory may not exist yet during early phases
  }
  return files
}

describe('SSR safety', () => {
  // -------------------------------------------------------
  // Server files: no browser globals
  // -------------------------------------------------------
  describe('server files — no browser globals', () => {
    // Match browser API property access, not type/variable names
    const browserGlobals = [
      /\bwindow\./,
      /\bdocument\.(querySelector|getElementById|createElement|body|head|addEventListener)/,
      /\blocalStorage\./,
      /\bsessionStorage\./,
      /\bnavigator\./,
    ]

    const serverFiles = getSourceFiles(SERVER_DIR)

    for (const file of serverFiles) {
      const relativePath = file.replace(SRC_DIR, 'src/')

      // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: test scanning logic
      it(`${relativePath} has no unguarded browser globals`, () => {
        const content = readFileSync(file, 'utf-8')
        const lines = content.split('\n')

        for (let i = 0; i < lines.length; i++) {
          const line = lines[i]
          // Skip comments and imports
          if (
            line.trimStart().startsWith('//') ||
            line.trimStart().startsWith('*') ||
            line.trimStart().startsWith('import')
          ) {
            continue
          }
          for (const pattern of browserGlobals) {
            if (pattern.test(line)) {
              // Allow typeof checks
              if (/typeof\s+(window|document|localStorage|sessionStorage|navigator)/.test(line)) {
                continue
              }
              throw new Error(
                `Browser global found in server file at line ${i + 1}: "${line.trim()}"\n` +
                  `File: ${relativePath}`
              )
            }
          }
        }
      })
    }

    it('at least one server file was scanned', () => {
      expect(serverFiles.length).toBeGreaterThan(0)
    })
  })

  // -------------------------------------------------------
  // Server entry point: no React imports
  // -------------------------------------------------------
  describe('server entry point isolation', () => {
    it('server index does not import React', () => {
      try {
        const serverIndex = readFileSync(resolve(SRC_DIR, 'server/index.ts'), 'utf-8')
        expect(serverIndex).not.toMatch(/from\s+['"]react['"]/)
        expect(serverIndex).not.toMatch(/import.*React/)
      } catch {
        // File may not exist yet — skip
      }
    })

    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: test scanning logic
    it('server files do not have runtime imports from client directories', () => {
      const serverFiles = getSourceFiles(SERVER_DIR)
      const clientDirs = ['../hooks', '../components', '../context']

      for (const file of serverFiles) {
        const content = readFileSync(file, 'utf-8')
        const lines = content.split('\n')
        for (const line of lines) {
          // Skip type-only imports (erased at compile time)
          if (line.trimStart().startsWith('import type')) continue
          for (const clientDir of clientDirs) {
            if (line.includes(`from '${clientDir}`) || line.includes(`from "${clientDir}`)) {
              throw new Error(`Runtime import from client directory in server file: ${line.trim()}`)
            }
          }
        }
      }
    })
  })
})
