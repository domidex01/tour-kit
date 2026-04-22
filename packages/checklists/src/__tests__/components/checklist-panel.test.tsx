import { cleanup, render } from '@testing-library/react'
import * as React from 'react'
import { afterEach, describe, expect, it } from 'vitest'
import { ChecklistPanel } from '../../components/checklist-panel'
import { ChecklistProvider } from '../../context/checklist-provider'
import type { ChecklistConfig } from '../../types'

const simpleChecklist: ChecklistConfig = {
  id: 'onboarding',
  title: 'Onboarding',
  tasks: [
    { id: 't1', title: 'Task 1' },
    { id: 't2', title: 'Task 2' },
  ],
}

afterEach(cleanup)

describe('ChecklistPanel — defaultExpanded does not infinite-loop', () => {
  it('does not re-dispatch SET_EXPANDED when defaultExpanded matches the seeded state', () => {
    // Count how many times the panel commits. If we loop, this will climb unboundedly.
    let commitCount = 0

    function CountingPanel() {
      React.useEffect(() => {
        commitCount += 1
      })
      return <ChecklistPanel checklistId="onboarding" defaultExpanded={true} />
    }

    render(
      <ChecklistProvider checklists={[simpleChecklist]}>
        <CountingPanel />
      </ChecklistProvider>
    )

    // Two commits max: initial mount, plus optional re-render once ProGate settles.
    // The bug caused unbounded commits.
    expect(commitCount).toBeLessThan(10)
  })

  it('does not commit excessively with defaultExpanded=false', () => {
    let commitCount = 0

    function CountingPanel() {
      React.useEffect(() => {
        commitCount += 1
      })
      return <ChecklistPanel checklistId="onboarding" defaultExpanded={false} />
    }

    render(
      <ChecklistProvider checklists={[simpleChecklist]}>
        <CountingPanel />
      </ChecklistProvider>
    )

    expect(commitCount).toBeLessThan(10)
  })

  it('survives React.StrictMode double-invoke without looping', () => {
    let commitCount = 0

    function CountingPanel() {
      React.useEffect(() => {
        commitCount += 1
      })
      return <ChecklistPanel checklistId="onboarding" defaultExpanded />
    }

    render(
      <React.StrictMode>
        <ChecklistProvider checklists={[simpleChecklist]}>
          <CountingPanel />
        </ChecklistProvider>
      </React.StrictMode>
    )

    // StrictMode will double-invoke effects but not loop infinitely.
    expect(commitCount).toBeLessThan(20)
  })
})
