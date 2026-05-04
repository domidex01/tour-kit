import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { interpolate } from './interpolate'

describe('interpolate', () => {
  describe('happy path', () => {
    it('substitutes a flat key', () => {
      expect(interpolate('Hi {{name}}', { name: 'Domi' })).toBe('Hi Domi')
    })

    it('substitutes a nested key via dot', () => {
      expect(
        interpolate('Hi {{user.profile.name}}', { user: { profile: { name: 'D' } } })
      ).toBe('Hi D')
    })

    it.each([
      [123, 'Hi 123'],
      [true, 'Hi true'],
      [false, 'Hi false'],
      [0, 'Hi 0'],
    ])('coerces %s via String()', (value, expected) => {
      expect(interpolate('Hi {{x}}', { x: value })).toBe(expected)
    })

    it('returns template untouched when there are no template tokens (fast path)', () => {
      expect(interpolate('No tokens here', {})).toBe('No tokens here')
    })

    it('returns template untouched when vars is undefined and no tokens', () => {
      expect(interpolate('plain text', undefined)).toBe('plain text')
    })
  })

  describe('fallbacks', () => {
    it('uses inline fallback when key missing', () => {
      expect(interpolate('Hi {{name | there}}', {})).toBe('Hi there')
    })

    it('uses inline fallback when vars undefined', () => {
      expect(interpolate('Hi {{name | there}}', undefined)).toBe('Hi there')
    })

    it('returns empty replacement when key missing and no inline fallback', () => {
      expect(interpolate('Hi {{name}}', {}, { warnOnMissing: false })).toBe('Hi ')
    })

    it('respects opts.defaultFallback when missing key has no inline fallback', () => {
      expect(
        interpolate('Hi {{name}}', {}, { warnOnMissing: false, defaultFallback: '???' })
      ).toBe('Hi ???')
    })

    it('treats null and undefined as missing (uses fallback)', () => {
      expect(interpolate('Hi {{x | nope}}', { x: null })).toBe('Hi nope')
      expect(interpolate('Hi {{x | nope}}', { x: undefined })).toBe('Hi nope')
    })
  })

  describe('XSS safety', () => {
    it('returns literal HTML string with no parsing or execution', () => {
      const payload = '<script>alert(1)</script>'
      // Critical: assert string equality, not innerHTML / DOM parse
      expect(interpolate('{{x}}', { x: payload })).toBe(payload)
    })

    it('does not interpret HTML entities', () => {
      expect(interpolate('{{x}}', { x: '&lt;b&gt;bold&lt;/b&gt;' })).toBe('&lt;b&gt;bold&lt;/b&gt;')
    })
  })

  describe('malformed input', () => {
    it('returns original when no closing braces', () => {
      expect(interpolate('Hi {{name', { name: 'D' })).toBe('Hi {{name')
    })

    it('leaves {{}} unchanged (regex requires at least one key char)', () => {
      // The TEMPLATE_RE pattern uses `+?` for the key group, so an empty token
      // doesn't match — the literal is preserved (same posture as `{{name`).
      const out = interpolate('Hi {{}}', {}, { warnOnMissing: false })
      expect(out).toBe('Hi {{}}')
    })
  })

  describe('dev-only warning', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>

    beforeEach(() => {
      warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      warnSpy.mockRestore()
      vi.unstubAllEnvs()
    })

    it('warns once for missing key in dev', () => {
      vi.stubEnv('NODE_ENV', 'development')
      interpolate('Hi {{name}}', {})
      expect(warnSpy).toHaveBeenCalledTimes(1)
      expect(warnSpy.mock.calls[0]?.[0]).toMatch(/missing key "name"/)
    })

    it('does not warn in production', () => {
      vi.stubEnv('NODE_ENV', 'production')
      interpolate('Hi {{name}}', {})
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('respects opts.warnOnMissing override', () => {
      vi.stubEnv('NODE_ENV', 'development')
      interpolate('Hi {{name}}', {}, { warnOnMissing: false })
      expect(warnSpy).not.toHaveBeenCalled()
    })

    it('does not warn when inline fallback is present', () => {
      vi.stubEnv('NODE_ENV', 'development')
      interpolate('Hi {{name | there}}', {})
      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('performance', () => {
    it('runs 10 000 iterations under 100 ms', () => {
      const template = 'a {{x}} b {{y}} c {{z}}'
      const vars = { x: 1, y: 2, z: 3 }
      const start = performance.now()
      for (let i = 0; i < 10_000; i++) interpolate(template, vars)
      const duration = performance.now() - start
      // 100 ms ceiling — generous to survive jsdom + WSL cold start while
      // still catching a 10× regression (typical baseline ≈ 30–60 ms).
      // Sub-ms perf tracking lives in interpolate.bench.ts.
      expect(duration).toBeLessThan(100)
    })
  })
})
