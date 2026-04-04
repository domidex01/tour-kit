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

// Mock @tour-kit/license — ProGate is the hard gate used by the provider
vi.mock('@tour-kit/license', () => ({
  ProGate: ({ children }: { children: React.ReactNode; package: string }) => {
    return <>{children}</>
  },
}))

import { AiChatProvider } from '../context/ai-chat-provider'

const minimalConfig = {
  endpoint: '/api/chat',
}

describe('AiChatProvider — license integration', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('renders children when ProGate allows (licensed)', () => {
    render(
      <AiChatProvider config={minimalConfig}>
        <div data-testid="child">Hello</div>
      </AiChatProvider>
    )

    expect(screen.getByTestId('child')).toBeInTheDocument()
  })

  it('does not render watermark (hard gate replaces watermark)', () => {
    render(
      <AiChatProvider config={minimalConfig}>
        <div>Hello</div>
      </AiChatProvider>
    )

    expect(screen.queryByText('UNLICENSED')).toBeNull()
    expect(screen.queryByText('Tour Kit Pro license required')).toBeNull()
  })
})

describe('AiChatProvider — ProGate blocks when unlicensed', () => {
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
      ProGate: ({ package: pkg }: { children: React.ReactNode; package: string }) => (
        <div data-testid="pro-gate-placeholder">Tour Kit Pro license required — {pkg}</div>
      ),
    }))
  })

  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('shows placeholder instead of children when unlicensed', async () => {
    const { AiChatProvider } = await import('../context/ai-chat-provider')

    render(
      <AiChatProvider config={minimalConfig}>
        <div data-testid="child">Hello</div>
      </AiChatProvider>
    )

    expect(screen.getByTestId('pro-gate-placeholder')).toBeInTheDocument()
    expect(screen.getByText(/Tour Kit Pro license required/)).toBeInTheDocument()
    expect(screen.getByText(/@tour-kit\/ai/)).toBeInTheDocument()
    expect(screen.queryByTestId('child')).toBeNull()
  })
})
