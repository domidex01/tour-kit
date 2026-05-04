import { renderHook } from '@testing-library/react'
import { LocaleProvider, SegmentationProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useResolvedText } from '../../hooks/use-resolved-text'

function wrap(
  messages: Record<string, string> = {},
  userContext: Record<string, unknown> = {}
): React.FC<{ children: ReactNode }> {
  return ({ children }) => (
    <LocaleProvider messages={messages}>
      <SegmentationProvider segments={{}} userContext={userContext}>
        {children}
      </SegmentationProvider>
    </LocaleProvider>
  )
}

describe('useResolvedText', () => {
  it('interpolates a string against userContext when no vars are passed', () => {
    const { result } = renderHook(() => useResolvedText('Hi {{user.name}}'), {
      wrapper: wrap({}, { user: { name: 'Domi' } }),
    })
    expect(result.current).toBe('Hi Domi')
  })

  it('resolves a { key } object via the messages dictionary', () => {
    const { result } = renderHook(() => useResolvedText({ key: 'welcome' }), {
      wrapper: wrap({ welcome: 'Hello' }),
    })
    expect(result.current).toBe('Hello')
  })

  it('passes ReactNode values through unchanged', () => {
    const node = <strong>X</strong>
    const { result } = renderHook(() => useResolvedText(node), { wrapper: wrap() })
    expect(result.current).toBe(node)
  })

  it('returns undefined when the value is undefined', () => {
    const { result } = renderHook(() => useResolvedText(undefined), { wrapper: wrap() })
    expect(result.current).toBeUndefined()
  })

  it('caller-supplied vars override userContext', () => {
    const { result } = renderHook(
      () => useResolvedText('Hi {{name}}', { name: 'Override' }),
      { wrapper: wrap({}, { name: 'FromContext' }) }
    )
    expect(result.current).toBe('Hi Override')
  })
})
