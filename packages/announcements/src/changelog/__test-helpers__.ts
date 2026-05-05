import { vi } from 'vitest'
import type { ChangelogEntry } from './feed'

/**
 * Mocks `window.matchMedia` so the `motion-safe:` Tailwind utility evaluates
 * deterministically. Per CLAUDE.md cross-package contract, motion-safe gates
 * on `@media (prefers-reduced-motion: no-preference)` — when `reduce: true`,
 * the utility does NOT apply.
 *
 * Use `vi.unstubAllGlobals()` in an afterEach to restore.
 */
export function mockReducedMotion(reduce: boolean): void {
  vi.stubGlobal(
    'matchMedia',
    vi.fn().mockImplementation((query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(() => false),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    }))
  )
  // Also patch the Window prototype path the SSR-safe hook reads on first render.
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    configurable: true,
    value: (query: string) => ({
      matches: reduce && query.includes('reduce'),
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      addListener: () => {},
      removeListener: () => {},
    }),
  })
}

/**
 * Three deterministic entries spanning the categories `Performance`,
 * `Bugfixes`, and `Features`. The third entry carries a `media` payload so
 * MediaSlot integration is observable via an `<iframe>` in the rendered DOM.
 *
 * `variant: 'modal'` is required because `ChangelogEntry extends
 * AnnouncementConfig`; the value is unused by the changelog renderer.
 */
export const MOCK_ENTRIES: ChangelogEntry[] = [
  {
    id: 'evt-1',
    variant: 'modal',
    title: 'Performance: 30% faster boot',
    description: 'We reduced initial bundle parse time.',
    permalink: 'https://acme.com/changelog/perf-30',
    publishedAt: new Date('2026-04-15T00:00:00Z'),
    category: 'Performance',
  },
  {
    id: 'evt-2',
    variant: 'modal',
    title: 'Bugfix: dark mode flicker',
    description: 'Fixed CSS variable race on initial paint.',
    permalink: 'https://acme.com/changelog/dark-flicker',
    publishedAt: new Date('2026-04-20T00:00:00Z'),
    category: 'Bugfixes',
  },
  {
    id: 'evt-3',
    variant: 'modal',
    title: 'Feature: SSO',
    description: 'SAML 2.0 support is GA.',
    permalink: 'https://acme.com/changelog/sso',
    publishedAt: new Date('2026-04-25T00:00:00Z'),
    category: 'Features',
    media: { src: 'https://youtu.be/dQw4w9WgXcQ' },
  },
]
