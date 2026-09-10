import { render, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { ChecklistPanel } from '../../components/checklist-panel'
import { ChecklistProvider } from '../../context/checklist-provider'
import { useChecklist } from '../../hooks/use-checklist'
import type { ChecklistConfig } from '../../types'

const config: ChecklistConfig = {
  id: 'c1',
  title: 'Onboarding',
  tasks: [
    { id: 't1', title: 'One' },
    { id: 't2', title: 'Two' },
  ],
}

describe('<ChecklistPanel defaultExpanded={false}> under persistence', () => {
  it('stays collapsed when nothing is persisted', async () => {
    render(
      <ChecklistProvider checklists={[config]} persistence={{ enabled: true }}>
        <ChecklistPanel checklistId="c1" defaultExpanded={false} />
      </ChecklistProvider>
    )
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Onboarding/ })).toHaveAttribute(
        'aria-expanded',
        'false'
      )
    )
  })

  // Decision 6. Against the pre-extraction reducer — which hard-coded
  // `isExpanded: true` in its LOAD_PERSISTED arm — this case fails with
  // aria-expanded="true": the panel's own layout effect had already applied
  // defaultExpanded={false}, and hydration clobbered it back open.
  it('stays collapsed when a persisted blob exists', async () => {
    localStorage.setItem(
      'tourkit-checklists',
      JSON.stringify({ completed: { c1: ['t1'] }, dismissed: [], timestamp: Date.now() })
    )
    render(
      <ChecklistProvider checklists={[config]} persistence={{ enabled: true }}>
        <ChecklistPanel checklistId="c1" defaultExpanded={false} />
      </ChecklistProvider>
    )
    await screen.findByText(/1 of 2 complete/)
    expect(screen.getByRole('button', { name: /Onboarding/ })).toHaveAttribute(
      'aria-expanded',
      'false'
    )
  })

  it('the first render is unpersisted — reads never construct the engine', () => {
    localStorage.setItem(
      'tourkit-checklists',
      JSON.stringify({ completed: { c1: ['t1', 't2'] }, dismissed: [], timestamp: Date.now() })
    )
    const seen: number[] = []
    function Probe() {
      // Read the CONTEXT, never `screen`. A render-phase `screen.queryByText`
      // is blind to the DOM its own commit produces — it answers `null`
      // unconditionally, so a DOM-reading probe here would push the same value
      // for every implementation, including one that reads storage in render.
      // Decision 5b.
      seen.push(useChecklist('c1').progress.completed)
      return null
    }
    render(
      <ChecklistProvider checklists={[config]} persistence={{ enabled: true }}>
        <ChecklistPanel checklistId="c1" />
        <Probe />
      </ChecklistProvider>
    )
    // 0 on the first render pass; 2 only after the boot effect hydrates.
    // Both ends are load-bearing: `seen[0]` alone passes against an engine
    // that never hydrates, and the last value alone passes against one that
    // hydrates during render. `.at(-1)` does not typecheck at this package's
    // ES2020 target, and tests ARE typechecked here.
    expect(seen[0]).toBe(0)
    expect(seen[seen.length - 1]).toBe(2)
  })
})
