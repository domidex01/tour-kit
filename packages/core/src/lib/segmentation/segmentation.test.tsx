import { render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { BulkSegmentProbe, SingleSegmentProbe, makeProvider } from './__test-utils__'

describe('SegmentationProvider + useSegment', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    // restoreAllMocks does NOT undo vi.stubEnv — explicit unstub prevents
    // a stubbed NODE_ENV from leaking across tests if an assertion throws
    // before the in-test unstub call runs.
    vi.unstubAllEnvs()
  })

  describe('named lookup (audience)', () => {
    it('returns true when userContext matches the segment conditions', () => {
      const Provider = makeProvider(
        {
          admins: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
        },
        { role: 'admin' }
      )
      render(
        <Provider>
          <SingleSegmentProbe name="admins" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('true')
    })

    it('returns false and warns once for unknown segment in dev', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Provider = makeProvider({})
      render(
        <Provider>
          <SingleSegmentProbe name="ghost" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('false')
      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/\[tour-kit\] useSegment: unknown segment "ghost"/)
    })

    it('does NOT warn for unknown segment in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Provider = makeProvider({})
      render(
        <Provider>
          <SingleSegmentProbe name="ghost" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('false')
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('AND-join semantics', () => {
    it('returns false when one of two conditions in the same segment fails', () => {
      const Provider = makeProvider(
        {
          'eu-pro': [
            { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
            { type: 'user_property', key: 'country', operator: 'equals', value: 'DE' },
          ],
        },
        { plan: 'pro', country: 'FR' } // country mismatches → AND fails
      )
      render(
        <Provider>
          <SingleSegmentProbe name="eu-pro" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('false')
    })

    it('returns true for an empty conditions array (matchesAudience: zero conditions = match-all)', () => {
      // Locks the cross-package contract: an empty SegmentDefinition inherits
      // matchesAudience's "no conditions = everyone matches" semantic. If a
      // future change ever flips this to "no one matches", this test fails
      // and forces the conversation.
      const Provider = makeProvider({ everyone: [] }, { role: 'guest' })
      render(
        <Provider>
          <SingleSegmentProbe name="everyone" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('true')
    })

    it('returns true when all conditions in the segment pass', () => {
      const Provider = makeProvider(
        {
          'eu-pro': [
            { type: 'user_property', key: 'plan', operator: 'equals', value: 'pro' },
            { type: 'user_property', key: 'country', operator: 'equals', value: 'DE' },
          ],
        },
        { plan: 'pro', country: 'DE' }
      )
      render(
        <Provider>
          <SingleSegmentProbe name="eu-pro" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('true')
    })
  })

  describe('static segments', () => {
    it('returns true when currentUserId is in the userIds list', () => {
      const Provider = makeProvider(
        { beta: { type: 'static', userIds: ['u_1', 'u_2'] } },
        undefined,
        'u_2'
      )
      render(
        <Provider>
          <SingleSegmentProbe name="beta" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('true')
    })

    it('returns false when currentUserId is undefined (no throw)', () => {
      const Provider = makeProvider(
        { beta: { type: 'static', userIds: ['u_1', 'u_2'] } },
        undefined,
        undefined
      )
      expect(() =>
        render(
          <Provider>
            <SingleSegmentProbe name="beta" />
          </Provider>
        )
      ).not.toThrow()
      expect(screen.getByTestId('single')).toHaveTextContent('false')
    })

    it('returns false for an empty userIds list (the "no-one" cohort)', () => {
      const Provider = makeProvider({ closed: { type: 'static', userIds: [] } }, undefined, 'u_42')
      render(
        <Provider>
          <SingleSegmentProbe name="closed" />
        </Provider>
      )
      expect(screen.getByTestId('single')).toHaveTextContent('false')
    })
  })

  describe('useSegments() bulk lookup', () => {
    it('returns booleans for both audience and static segments without warning', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const Provider = makeProvider(
        {
          admins: [{ type: 'user_property', key: 'role', operator: 'equals', value: 'admin' }],
          beta: { type: 'static', userIds: ['u_1'] },
        },
        { role: 'admin' },
        'u_1'
      )
      render(
        <Provider>
          <BulkSegmentProbe />
        </Provider>
      )
      const out = JSON.parse(screen.getByTestId('bulk').textContent ?? '{}')
      expect(out).toEqual({ admins: true, beta: true })
      // Enumeration walks only known names — warning would be wrong.
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('returns an empty object when no segments are registered', () => {
      const Provider = makeProvider({})
      render(
        <Provider>
          <BulkSegmentProbe />
        </Provider>
      )
      expect(screen.getByTestId('bulk').textContent).toBe('{}')
    })
  })

  describe('provider-optional', () => {
    it('useSegment returns false (with dev warn) when no provider is mounted', () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      // Render WITHOUT a <SegmentationProvider> wrapper — the default ctx
      // `{ segments: {} }` must keep the hook stable.
      render(<SingleSegmentProbe name="anything" />)
      expect(screen.getByTestId('single')).toHaveTextContent('false')
      expect(warnSpy).toHaveBeenCalledOnce()
    })
  })
})
