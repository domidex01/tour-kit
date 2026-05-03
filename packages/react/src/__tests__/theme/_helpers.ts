import { vi } from 'vitest'

/**
 * Stub `window.matchMedia` for theme tests.
 *
 * Defaults to "no media queries match" — useful when a test wants
 * `systemColorScheme === 'light'`. Pass `{ dark: true }` to flip the
 * `prefers-color-scheme: dark` query to a match.
 */
export function mockMatchMedia(opts: { dark?: boolean } = {}): void {
  vi.mocked(window.matchMedia).mockImplementation(
    (query: string) =>
      ({
        matches: opts.dark ? query.includes('prefers-color-scheme: dark') : false,
        media: query,
        onchange: null,
        addListener: vi.fn(),
        removeListener: vi.fn(),
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
        dispatchEvent: vi.fn(),
      }) as unknown as MediaQueryList
  )
}
