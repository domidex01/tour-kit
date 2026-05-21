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

  it('re-rendering the registrar leaf does not duplicate the registry entry', () => {
    const Registrar = () => (
      <Tour id="dup">
        <TourStep id="s1" target="#a" title="Hi" content="There" />
      </Tour>
    )
    function RegistryProbe() {
      const ctx = useTourRegistryContext()
      return <div data-testid="ids">{ctx.tours.map((t) => t.id).join(',')}</div>
    }

    const { rerender, getByTestId } = render(
      <MultiTourKitProvider>
        <Registrar key="r1" />
        <RegistryProbe />
      </MultiTourKitProvider>
    )

    expect(getByTestId('ids').textContent).toBe('dup')

    rerender(
      <MultiTourKitProvider>
        <Registrar key="r2" />
        <RegistryProbe />
      </MultiTourKitProvider>
    )

    expect(getByTestId('ids').textContent).toBe('dup')
  })
})
