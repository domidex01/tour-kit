// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

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

vi.mock('@tour-kit/license', () => ({
  LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => <>{children}</>,
}))

import { AiChatProvider } from '../context/ai-chat-provider'

const minimalConfig = {
  endpoint: '/api/chat',
}

describe('AiChatProvider — license integration (licensed)', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when LicenseGate allows (licensed)', () => {
    render(
      <AiChatProvider config={minimalConfig}>
        <div data-testid="child">Hello</div>
      </AiChatProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render the legacy hard placeholder copy when licensed', () => {
    render(
      <AiChatProvider config={minimalConfig}>
        <div>Hello</div>
      </AiChatProvider>
    )

    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
    expect(screen.queryByTestId('license-watermark')).toBeNull()
  })
})

describe('AiChatProvider — LicenseGate soft-gates when unlicensed', () => {
  beforeEach(() => {
    vi.resetModules()

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

    vi.doMock('@tour-kit/license', () => ({
      LicenseGate: ({ children }: { children: React.ReactNode; require: 'pro' }) => (
        <>
          {children}
          <div data-testid="license-watermark">Tour Kit · Unlicensed</div>
        </>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children plus the unlicensed badge', async () => {
    const { AiChatProvider } = await import('../context/ai-chat-provider')

    render(
      <AiChatProvider config={minimalConfig}>
        <div data-testid="child">Hello</div>
      </AiChatProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
    expect(screen.getByTestId('license-watermark')).toBeInTheDocument()
    expect(screen.queryByText(/Tour Kit Pro license required/)).toBeNull()
  })
})
