import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Phase 3 (refactor train) — grep gate co-located with the test that the
// inline `priorityOrder: Record<string, number>` literal in
// `<AnnouncementsProvider>` was replaced with `createAnnouncementComparator`
// from `core/priority-queue.ts`. Co-located so a future refactor that
// re-introduces the literal trips the gate.
const __here = dirname(fileURLToPath(import.meta.url))
const PROVIDER_PATH = resolve(__here, '../../context/announcements-provider.tsx')

describe('announcements-provider.tsx — no inline priorityOrder literal', () => {
  const source = readFileSync(PROVIDER_PATH, 'utf-8')

  it('does not contain `priorityOrder: Record<string, number>`', () => {
    expect(source).not.toMatch(/priorityOrder:\s*Record<string,\s*number>/)
  })

  it('does not contain the hardcoded { critical: 0, high: 1, ...} object literal', () => {
    // Conservative match — flags reintroduction of the specific shape.
    expect(source).not.toMatch(/critical:\s*0[\s\S]{0,40}low:\s*3/)
  })

  it('imports createAnnouncementComparator from core/priority-queue', () => {
    expect(source).toMatch(/createAnnouncementComparator/)
    expect(source).toMatch(/from\s+['"]\.\.\/core\/priority-queue['"]/)
  })

  it('does not reach into schedulerRef.current.config (private field)', () => {
    expect(source).not.toMatch(/schedulerRef\.current\.config\b/)
  })

  it('uses the public queueConfig getter on the scheduler', () => {
    expect(source).toMatch(/schedulerRef\.current\.queueConfig\b/)
  })
})
