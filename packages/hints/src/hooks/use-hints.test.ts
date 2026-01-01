import { act, renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { createElement, useEffect } from 'react'
import { describe, expect, it } from 'vitest'
import { useHintsContext } from '../context/hints-context'
import { HintsProvider } from '../context/hints-provider'
import { useHints } from './use-hints'

describe('useHints', () => {
  const wrapper = ({ children }: { children: ReactNode }) =>
    createElement(HintsProvider, null, children)

  it('returns hints as array', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('h1')
        registerHint('h2')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.hints).toHaveLength(2)
  })

  it('returns activeHint', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint, showHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('active-hint')
        showHint('active-hint')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.activeHint).toBe('active-hint')
  })

  it('showHint opens a hint', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('show-test')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintVisible('show-test')).toBe(false)

    act(() => {
      result.current.showHint('show-test')
    })

    expect(result.current.isHintVisible('show-test')).toBe(true)
  })

  it('hideHint closes a hint', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint, showHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('hide-test')
        showHint('hide-test')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintVisible('hide-test')).toBe(true)

    act(() => {
      result.current.hideHint('hide-test')
    })

    expect(result.current.isHintVisible('hide-test')).toBe(false)
  })

  it('isHintVisible returns correct state', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('visibility-check')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintVisible('visibility-check')).toBe(false)

    act(() => {
      result.current.showHint('visibility-check')
    })

    expect(result.current.isHintVisible('visibility-check')).toBe(true)
  })

  it('isHintDismissed returns correct state', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('dismissed-check')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintDismissed('dismissed-check')).toBe(false)

    act(() => {
      result.current.dismissHint('dismissed-check')
    })

    expect(result.current.isHintDismissed('dismissed-check')).toBe(true)
  })

  it('resetAllHints resets all dismissed hints', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint, dismissHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('h1')
        registerHint('h2')
        dismissHint('h1')
        dismissHint('h2')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintDismissed('h1')).toBe(true)
    expect(result.current.isHintDismissed('h2')).toBe(true)

    act(() => {
      result.current.resetAllHints()
    })

    expect(result.current.isHintDismissed('h1')).toBe(false)
    expect(result.current.isHintDismissed('h2')).toBe(false)
  })

  it('resetHint resets a single dismissed hint', () => {
    function SetupComponent({ children }: { children: ReactNode }) {
      const { registerHint, dismissHint } = useHintsContext()
      // biome-ignore lint/correctness/useExhaustiveDependencies: intentional for test setup
      useEffect(() => {
        registerHint('reset-single')
        dismissHint('reset-single')
      }, [])
      return createElement('div', null, children)
    }

    const { result } = renderHook(() => useHints(), {
      wrapper: ({ children }) =>
        createElement(HintsProvider, null, createElement(SetupComponent, null, children)),
    })

    expect(result.current.isHintDismissed('reset-single')).toBe(true)

    act(() => {
      result.current.resetHint('reset-single')
    })

    expect(result.current.isHintDismissed('reset-single')).toBe(false)
  })

  it('returns false for non-existent hint visibility', () => {
    const { result } = renderHook(() => useHints(), { wrapper })

    expect(result.current.isHintVisible('non-existent')).toBe(false)
  })

  it('returns false for non-existent hint dismissed state', () => {
    const { result } = renderHook(() => useHints(), { wrapper })

    expect(result.current.isHintDismissed('non-existent')).toBe(false)
  })
})
