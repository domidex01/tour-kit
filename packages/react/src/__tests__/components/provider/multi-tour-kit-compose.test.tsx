import { render, renderHook } from '@testing-library/react'
import { useTour } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import {
  MultiTourKitProvider,
  useTourRegistryContext,
} from '../../../components/provider/tourkit-provider'
import { Tour } from '../../../components/tour/tour'
import { TourStep } from '../../../components/tour/tour-step'

// Wrap children five `<div>`s deep — proves registry lookup survives nesting.
function DeepWrapper({ children }: { children: ReactNode }) {
  return (
    <MultiTourKitProvider>
      <Tour id="x">
        <TourStep id="s1" target="#a" title="Hi" content="There" />
      </Tour>
      <div>
        <div>
          <div>
            <div>
              <div>{children}</div>
            </div>
          </div>
        </div>
      </div>
    </MultiTourKitProvider>
  )
}

describe('<MultiTourKitProvider> compose-mode', () => {
  it('useTour() from a deeply-nested child returns a controller (not null, not thrown)', () => {
    const { result } = renderHook(() => useTour(), { wrapper: DeepWrapper })
    expect(result.current).toBeDefined()
    expect(result.current.isActive).toBe(false)
  })

  it('registry exposes the registered tour id', () => {
    const { result } = renderHook(() => useTourRegistryContext(), { wrapper: DeepWrapper })
    const ids = result.current.tours.map((t) => t.id)
    expect(ids).toContain('x')
  })

  it('re-registering the same id with a new tour object never grows the registry', () => {
    // Same-instance re-render with a prop that forces a fresh `tour` identity
    // each pass. Pins the contract: regardless of whether the implementation
    // routes through cleanup→register OR the `if (exists) replace` branch in
    // `tourkit-provider.tsx` registerTour, the registry must stay at exactly
    // one entry. Assertion includes a `|${count}` suffix so a regression that
    // appends without dedup surfaces as a count mismatch, not a string-id one.
    function Registrar({ contentVersion }: { contentVersion: number }) {
      return (
        <Tour id="dup">
          <TourStep id="s1" target="#a" title="Hi" content={`There v${contentVersion}`} />
        </Tour>
      )
    }
    function RegistryProbe() {
      const ctx = useTourRegistryContext()
      const ids = ctx.tours.map((t) => t.id).join(',')
      const count = ctx.tours.length
      return <div data-testid="ids">{`${ids}|${count}`}</div>
    }

    const { rerender, getByTestId } = render(
      <MultiTourKitProvider>
        <Registrar contentVersion={1} />
        <RegistryProbe />
      </MultiTourKitProvider>
    )

    expect(getByTestId('ids').textContent).toBe('dup|1')

    rerender(
      <MultiTourKitProvider>
        <Registrar contentVersion={2} />
        <RegistryProbe />
      </MultiTourKitProvider>
    )

    // Same id, new tour identity → registry must stay at one entry, not two.
    expect(getByTestId('ids').textContent).toBe('dup|1')
  })
})
