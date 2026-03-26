import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { gzipSync } from 'node:zlib'
import { describe, expect, it } from 'vitest'

const PKG_ROOT = process.cwd()
const DIST_DIR = resolve(PKG_ROOT, 'dist')
const HAS_DIST = existsSync(DIST_DIR)

/** Get gzipped size of a file in KB */
function getGzippedSizeKB(filePath: string): number {
  const content = readFileSync(filePath)
  const gzipped = gzipSync(content)
  return gzipped.length / 1024
}

describe('Bundle size verification', () => {
  // Skip all tests if dist/ does not exist (not built yet)
  describe.skipIf(!HAS_DIST)('post-build size checks', () => {
    // -------------------------------------------------------
    // Client entry
    // -------------------------------------------------------
    describe('client entry (index)', () => {
      const clientEntry = resolve(DIST_DIR, 'index.js')

      it('client entry file exists', () => {
        expect(existsSync(clientEntry)).toBe(true)
      })

      it('client entry is under 15KB gzipped', () => {
        const sizeKB = getGzippedSizeKB(clientEntry)
        expect(sizeKB).toBeLessThan(15)
      })
    })

    // -------------------------------------------------------
    // Server entry
    // -------------------------------------------------------
    describe('server entry', () => {
      const serverEntry = resolve(DIST_DIR, 'server')
      const serverCandidates = [
        resolve(serverEntry, 'index.js'),
        resolve(serverEntry, 'index.mjs'),
        resolve(DIST_DIR, 'server.js'),
        resolve(DIST_DIR, 'server.mjs'),
      ]

      it('server entry file exists', () => {
        const exists = serverCandidates.some((p) => existsSync(p))
        expect(exists).toBe(true)
      })

      it('server entry is under 8KB gzipped', () => {
        const serverPath = serverCandidates.find((p) => existsSync(p))
        if (serverPath) {
          const sizeKB = getGzippedSizeKB(serverPath)
          expect(sizeKB).toBeLessThan(8)
        }
      })
    })

    // -------------------------------------------------------
    // No accidental large dependencies
    // -------------------------------------------------------
    describe('no accidental large dependencies in bundle', () => {
      it('client bundle does not contain react-markdown source', () => {
        const clientEntry = resolve(DIST_DIR, 'index.js')
        if (existsSync(clientEntry)) {
          const content = readFileSync(clientEntry, 'utf-8')
          expect(content).not.toContain('react-markdown')
          expect(content).not.toContain('remark-parse')
        }
      })
    })
  })

  // -------------------------------------------------------
  // Size limit config exists
  // -------------------------------------------------------
  describe('size-limit configuration', () => {
    it('.size-limit.json exists in package root', () => {
      const sizeLimitPath = resolve(PKG_ROOT, '.size-limit.json')
      expect(existsSync(sizeLimitPath)).toBe(true)
    })

    it('.size-limit.json has entries for client and server', () => {
      const sizeLimitPath = resolve(PKG_ROOT, '.size-limit.json')
      if (existsSync(sizeLimitPath)) {
        const config = JSON.parse(readFileSync(sizeLimitPath, 'utf-8'))
        expect(config).toBeInstanceOf(Array)
        expect(config.length).toBeGreaterThanOrEqual(2)

        const names = config.map((entry: { name: string }) => entry.name)
        expect(names.some((n: string) => n.includes('client'))).toBe(true)
        expect(names.some((n: string) => n.includes('server'))).toBe(true)
      }
    })
  })
})
