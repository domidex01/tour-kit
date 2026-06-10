import { act, waitFor } from '@testing-library/react'
import * as React from 'react'
import { type Root, hydrateRoot } from 'react-dom/client'
import { renderToString } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { twoStepTour } from '../../__tests__/_fixtures'
import { serialize } from '../../lib/flow-session'
import { useTourContext } from '../tour-context'
import { TourProvider } from '../tour-provider'
import { TourKitProvider } from '../tourkit-provider'

/**
 * SSR hydration regression suite (QA handoff 2026-06-10, T1).
 *
 * The first client render must equal the server render byte-for-byte. Any
 * client-only branch at render time (reading localStorage/sessionStorage in a
 * useState initializer, document.dir sniffing, …) shifts React's useId tree
 * positions, which surfaced in consumers as an `aria-controls` hydration
 * mismatch on the checklists launcher. Persisted state must reconcile in
 * effects AFTER hydration, never during the initial render.
 *
 * Technique: render the tree to a string with EMPTY storage (what a server,
 * which has no storage at all, would produce), then seed storage with
 * persisted tour state — completed tours + an active flow session — and
 * hydrate. React logs hydration mismatches via console.error / the root's
 * onRecoverableError; both are captured and asserted empty.
 */

/** Renders values that depend on persisted tour state, plus a useId consumer. */
function StateProbe() {
  const { completedTours, isActive } = useTourContext()
  const id = React.useId()
  return (
    <div>
      {/* Mimics the checklists-launcher pattern that originally broke */}
      <button type="button" aria-controls={id} data-testid="probe-btn">
        probe
      </button>
      <div id={id} />
      <output data-testid="completed">{completedTours.join(',')}</output>
      <output data-testid="active">{String(isActive)}</output>
      {/* A branch directly conditioned on persisted state: with render-time
          storage seeding this renders an extra node on the client only,
          shifting useId positions for everything after it. */}
      {completedTours.includes('demo') ? <span data-testid="badge">done</span> : null}
      <DownstreamIdConsumer />
    </div>
  )
}

/** A useId consumer positioned AFTER the conditional branch. */
function DownstreamIdConsumer() {
  const id = React.useId()
  return <input aria-describedby={id} data-testid="downstream" readOnly />
}

function App() {
  return (
    <TourKitProvider
      config={{
        persistence: { enabled: true, trackCompleted: true, storage: 'localStorage' },
      }}
    >
      <TourProvider
        tours={[twoStepTour]}
        routePersistence={{
          enabled: true,
          storage: 'sessionStorage',
          flowSession: { storage: 'sessionStorage' },
        }}
      >
        <StateProbe />
      </TourProvider>
    </TourKitProvider>
  )
}

let container: HTMLDivElement
let root: Root | undefined
let consoleErrorSpy: ReturnType<typeof vi.spyOn>
let recoverableErrors: unknown[]

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  container = document.createElement('div')
  document.body.appendChild(container)
  recoverableErrors = []
  consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
})

afterEach(() => {
  act(() => root?.unmount())
  root = undefined
  container.remove()
  consoleErrorSpy.mockRestore()
  localStorage.clear()
  sessionStorage.clear()
})

function seedPersistedState() {
  // usePersistence: completed tours under `tourkit:completed`
  localStorage.setItem('tourkit:completed', JSON.stringify(['demo']))
  // useFlowSession: active flow blob under `tourkit:flow:active`
  sessionStorage.setItem(
    'tourkit:flow:active',
    serialize({
      schemaVersion: 2,
      tourId: 'demo',
      stepIndex: 1,
      currentRoute: undefined,
      startedAt: Date.now() - 1000,
      lastUpdatedAt: Date.now() - 1000,
    })
  )
}

function hydrate(serverHtml: string) {
  container.innerHTML = serverHtml
  act(() => {
    root = hydrateRoot(container, <App />, {
      onRecoverableError: (err) => {
        recoverableErrors.push(err)
      },
    })
  })
}

function hydrationFailures(): string[] {
  const fromConsole = consoleErrorSpy.mock.calls
    .map((args: unknown[]) => args.map(String).join(' '))
    .filter((msg: string) => /hydrat|did not match|server rendered/i.test(msg))
  const fromRecoverable = recoverableErrors.map(String).filter((msg) => /hydrat/i.test(msg))
  return [...fromConsole, ...fromRecoverable]
}

describe('SSR → hydrate with persisted tour state', () => {
  it('first client render matches server HTML (no hydration errors, stable useId)', async () => {
    // 1. "Server" pass: no storage state, as on a real server.
    const serverHtml = renderToString(<App />)
    const serverAriaControls = /aria-controls="([^"]+)"/.exec(serverHtml)?.[1]
    const serverDescribedBy = /aria-describedby="([^"]+)"/.exec(serverHtml)?.[1]
    expect(serverAriaControls).toBeTruthy()
    expect(serverDescribedBy).toBeTruthy()

    // 2. Client has persisted state the server never saw.
    seedPersistedState()

    // 3. Hydrate — must not warn, must keep the server ids.
    hydrate(serverHtml)

    expect(hydrationFailures()).toEqual([])
    const btn = container.querySelector('[data-testid="probe-btn"]')
    const downstream = container.querySelector('[data-testid="downstream"]')
    expect(btn?.getAttribute('aria-controls')).toBe(serverAriaControls)
    expect(downstream?.getAttribute('aria-describedby')).toBe(serverDescribedBy)

    // 4. Persisted state reconciles AFTER hydration in effects.
    await waitFor(() => {
      expect(container.querySelector('[data-testid="completed"]')?.textContent).toBe('demo')
      expect(container.querySelector('[data-testid="badge"]')).not.toBeNull()
    })
  })

  it('flow session still resumes the tour after hydration (deferred, not lost)', async () => {
    const serverHtml = renderToString(<App />)
    seedPersistedState()
    document.body.insertAdjacentHTML('beforeend', '<div id="a"></div><div id="b"></div>')
    hydrate(serverHtml)

    expect(hydrationFailures()).toEqual([])
    await waitFor(() => {
      expect(container.querySelector('[data-testid="active"]')?.textContent).toBe('true')
    })
  })

  it('completed autoStart tour does not restart after reload (hydration-deferred check)', async () => {
    const autoTour = { ...twoStepTour, autoStart: true }
    const ui = (
      <TourKitProvider
        config={{ persistence: { enabled: true, trackCompleted: true, storage: 'localStorage' } }}
      >
        <TourProvider tours={[autoTour]} routePersistence={{ enabled: false }}>
          <StateProbe />
        </TourProvider>
      </TourKitProvider>
    )
    const serverHtml = renderToString(ui)
    localStorage.setItem('tourkit:completed', JSON.stringify(['demo']))
    container.innerHTML = serverHtml
    act(() => {
      root = hydrateRoot(container, ui, {
        onRecoverableError: (err) => recoverableErrors.push(err),
      })
    })

    expect(hydrationFailures()).toEqual([])
    // Give the autostart effect a tick: it must observe the persisted
    // completion (read directly from storage) and stay inactive.
    await act(async () => {
      await Promise.resolve()
    })
    expect(container.querySelector('[data-testid="active"]')?.textContent).toBe('false')
    await waitFor(() => {
      expect(container.querySelector('[data-testid="completed"]')?.textContent).toBe('demo')
    })
  })
})
