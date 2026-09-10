import { renderToString } from 'react-dom/server'
import { beforeEach, describe, expect, it } from 'vitest'
import { ChecklistPanel } from '../../components/checklist-panel'
import { ChecklistProvider } from '../../context/checklist-provider'
import type { ChecklistConfig } from '../../types'

const config: ChecklistConfig = {
  id: 'c1',
  title: 'Getting started',
  tasks: [
    { id: 't1', title: 'First task' },
    { id: 't2', title: 'Second task', dependsOn: ['t1'] },
  ],
}

// React inserts `<!-- -->` between adjacent text nodes on the server, so the
// progress line arrives as `0<!-- --> of <!-- -->2<!-- --> complete`. Strip
// them or every text assertion below is a false red.
const stripComments = (out: string) => out.replace(/<!-- -->/g, '')

const html = () =>
  stripComments(
    renderToString(
      <ChecklistProvider checklists={[config]} persistence={{ enabled: true }}>
        <ChecklistPanel checklistId="c1" />
      </ChecklistProvider>
    )
  )

describe('server render (v3 Phase 2, Decision 5a)', () => {
  // Deliberately jsdom, not a node realm: case 2 has to SEED localStorage to
  // mean anything, and under node there is no storage to seed — the case would
  // become a copy of case 1 and pass for the wrong reason. `renderToString`
  // runs no effects either way, which is the property under test.
  beforeEach(() => localStorage.clear())

  it('the server payload carries the checklist', () => {
    // No effect runs on a server — not the provider's boot effect and not the
    // panel's layout effect — so this is exactly what a lazily-constructed
    // handle would empty: `getChecklist` returns undefined and
    // `<ChecklistPanel>` hits `if (!checklist) return null`.
    const out = html()
    expect(out).toContain('Getting started')
    expect(out).toContain('First task')
    expect(out).toContain('Second task')
    expect(out).toContain('0 of 2 complete')
  })

  it('the server payload carries NO persisted state', () => {
    localStorage.setItem(
      'tourkit-checklists',
      JSON.stringify({ completed: { c1: ['t1'] }, dismissed: [], timestamp: Date.now() })
    )
    // The seed is config-derived. `boot()` belongs to the passive effect and
    // must not have run — this is `dee2a1f1`'s invariant, restated for the
    // seam that could quietly undo it.
    expect(html()).toContain('0 of 2 complete')
  })
})
