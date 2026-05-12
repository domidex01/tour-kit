import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { repoRoot } from './_helpers'

const REPO = repoRoot()
const DECISIONS = 'tasks/sprint-1-ts-first-dx/plan/phase-0-decisions.md'

describe('Phase 0 — decisions log', () => {
  const text = readFileSync(join(REPO, DECISIONS), 'utf8')

  it('locks the chart dependency to native CSS', () => {
    expect(text).toMatch(/Chart[^:\n]*:\s*native CSS/i)
  })

  it('locks the codemod tool (jscodeshift or ts-morph)', () => {
    expect(text).toMatch(/Codemod tool[^:\n]*:\s*(jscodeshift|ts-morph)/i)
  })

  it('locks the diagnostic extension contract to DiagnosticGate', () => {
    expect(text).toMatch(/Diagnostic extension[^:\n]*:\s*DiagnosticGate/i)
  })

  it('contains no [TBD] placeholders', () => {
    expect(text).not.toMatch(/\[TBD\]/i)
  })
})
