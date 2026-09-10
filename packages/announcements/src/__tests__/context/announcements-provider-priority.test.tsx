import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

// Phase 3 (refactor train) — grep gate that the inline
// `priorityOrder: Record<string, number>` literal in `<AnnouncementsProvider>`
// was replaced with `createAnnouncementComparator` from `core/priority-queue.ts`.
//
// v3 Phase 3 — RE-POINTED, and this is a third named exception to the
// "existing tests untouched" rule (plan Decision 11), of the same class as the
// FORCE_SHOW_BYPASS one: the gate's SUBJECT moved. The auto-show sort now lives
// in `lib/announcements-engine/create-announcements-engine.ts`, so a scan of
// the provider alone had gone vacuous — it would pass forever no matter what
// the sort did. Every assertion keeps its intent and strength; the two negative
// ones are strictly STRONGER, because they now cover both files rather than one.
const __here = dirname(fileURLToPath(import.meta.url))
const PROVIDER_PATH = resolve(__here, '../../context/announcements-provider.tsx')
const ENGINE_PATH = resolve(__here, '../../lib/announcements-engine/create-announcements-engine.ts')

describe('the auto-show sort — no inline priorityOrder literal', () => {
  const provider = readFileSync(PROVIDER_PATH, 'utf-8')
  const engine = readFileSync(ENGINE_PATH, 'utf-8')
  const both = { provider, engine }

  it('neither file contains `priorityOrder: Record<string, number>`', () => {
    for (const [name, source] of Object.entries(both)) {
      expect(source, name).not.toMatch(/priorityOrder:\s*Record<string,\s*number>/)
    }
  })

  it('neither file contains the hardcoded { critical: 0, high: 1, ...} object literal', () => {
    // Conservative match — flags reintroduction of the specific shape.
    for (const [name, source] of Object.entries(both)) {
      expect(source, name).not.toMatch(/critical:\s*0[\s\S]{0,40}low:\s*3/)
    }
  })

  it('the engine imports createAnnouncementComparator from core/priority-queue', () => {
    expect(engine).toMatch(/createAnnouncementComparator/)
    expect(engine).toMatch(/from\s+['"]\.\.\/\.\.\/core\/priority-queue['"]/)
  })

  it('does not reach into the scheduler private `config` field', () => {
    for (const [name, source] of Object.entries(both)) {
      expect(source, name).not.toMatch(/scheduler(Ref\.current)?\.config\b/)
    }
  })

  it('uses the public queueConfig getter on the scheduler', () => {
    expect(engine).toMatch(/scheduler\.queueConfig\b/)
  })
})
