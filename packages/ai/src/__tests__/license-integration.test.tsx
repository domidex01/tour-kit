// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// Mock @ai-sdk/react and ai before any imports
vi.mock('@ai-sdk/react', () => ({
  useChat: () => ({
    messages: [],
    status: 'awaiting_message',
    error: null,
    sendMessage: vi.fn(),
    stop: vi.fn(),
    regenerate: vi.fn(),
    setMessages: vi.fn(),
  }),
}))

vi.mock('ai', () => ({
  DefaultChatTransport: vi.fn(),
}))

type LicenseState = 'not-installed' | 'invalid' | 'valid'

const LICENSE_RESULTS: Record<LicenseState, { isLicensed: boolean; isLoading: boolean }> = {
  'not-installed': { isLicensed: true, isLoading: false },
  invalid: { isLicensed: false, isLoading: false },
  valid: { isLicensed: true, isLoading: false },
}

function setupLicenseMock(state: LicenseState) {
  vi.resetModules()
  const result = LICENSE_RESULTS[state]

  // Re-register the static mocks after resetModules
  vi.doMock('@ai-sdk/react', () => ({
    useChat: () => ({
      messages: [],
      status: 'awaiting_message',
      error: null,
      sendMessage: vi.fn(),
      stop: vi.fn(),
      regenerate: vi.fn(),
      setMessages: vi.fn(),
    }),
  }))

  vi.doMock('ai', () => ({
    DefaultChatTransport: vi.fn(),
  }))

  vi.doMock('../lib/use-license-check', () => ({
    useLicenseCheck: () => result,
  }))
}

async function importProvider() {
  const mod = await import('../context/ai-chat-provider')
  return mod.AiChatProvider
}

const minimalConfig = {
  endpoint: '/api/chat',
}

describe('AiChatProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  describe('when @tour-kit/license is NOT installed', () => {
    beforeEach(() => {
      setupLicenseMock('not-installed')
    })

    it('renders children without errors', async () => {
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div data-testid="child">Hello</div>
        </AiChatProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('does not render watermark', async () => {
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div>Hello</div>
        </AiChatProvider>
      )

      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div>Hello</div>
        </AiChatProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })

  describe('when @tour-kit/license is installed but license is invalid', () => {
    beforeEach(() => {
      setupLicenseMock('invalid')
    })

    it('renders children (soft enforcement)', async () => {
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div data-testid="child">Hello</div>
        </AiChatProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
    })

    it('renders UNLICENSED watermark overlay', async () => {
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div>Hello</div>
        </AiChatProvider>
      )

      const watermark = screen.getByText('UNLICENSED')
      expect(watermark).toBeInTheDocument()
      expect(watermark).toHaveAttribute('aria-hidden', 'true')
    })

    it('fires console.warn with package name in development', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div>Hello</div>
        </AiChatProvider>
      )

      expect(warnSpy).toHaveBeenCalledOnce()
      expect(warnSpy).toHaveBeenCalledWith(
        expect.stringContaining('@tour-kit/ai')
      )
    })
  })

  describe('when @tour-kit/license is installed with valid license', () => {
    beforeEach(() => {
      setupLicenseMock('valid')
    })

    it('renders children without watermark', async () => {
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div data-testid="child">Hello</div>
        </AiChatProvider>
      )

      expect(screen.getByTestId('child')).toBeInTheDocument()
      expect(screen.queryByText('UNLICENSED')).toBeNull()
    })

    it('does not fire console.warn', async () => {
      const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const AiChatProvider = await importProvider()

      render(
        <AiChatProvider config={minimalConfig}>
          <div>Hello</div>
        </AiChatProvider>
      )

      expect(warnSpy).not.toHaveBeenCalled()
    })
  })
})
