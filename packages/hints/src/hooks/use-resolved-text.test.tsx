import { renderHook } from '@testing-library/react'
import { LocaleProvider, SegmentationProvider } from '@tour-kit/core'
import type { ReactNode } from 'react'
import { describe, expect, it } from 'vitest'
import { useResolvedText } from './use-resolved-text'

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

describe('useResolvedText (hints)', () => {
  it('interpolates a string against userContext', () => {
    const { result } = renderHook(() => useResolvedText('Hi {{user.name}}'), {
      wrapper: wrap({}, { user: { name: 'Domi' } }),
    })
    expect(result.current).toBe('Hi Domi')
  })

  it('resolves a { key } object via the messages dictionary', () => {
    const { result } = renderHook(() => useResolvedText({ key: 'hint.welcome' }), {
      wrapper: wrap({ 'hint.welcome': 'Hello' }),
    })
    expect(result.current).toBe('Hello')
  })

  it('passes ReactNode values through unchanged', () => {
    const node = <strong>X</strong>
    const { result } = renderHook(() => useResolvedText(node), { wrapper: wrap() })
    expect(result.current).toBe(node)
  })

  it('returns undefined for undefined input', () => {
    const { result } = renderHook(() => useResolvedText(undefined), { wrapper: wrap() })
    expect(result.current).toBeUndefined()
  })
})
