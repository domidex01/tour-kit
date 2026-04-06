'use client'

import { Component, type ErrorInfo, type ReactNode } from 'react'

// Free packages
import { TourProvider } from '@tour-kit/core'
import { HintsProvider } from '@tour-kit/hints'
import { Tour, TourStep } from '@tour-kit/react'

// Pro provider-gated
import { AdoptionProvider } from '@tour-kit/adoption'
import { AiChatProvider } from '@tour-kit/ai'
import { AnalyticsProvider } from '@tour-kit/analytics'
import { AnnouncementsProvider } from '@tour-kit/announcements'
import { ChecklistProvider } from '@tour-kit/checklists'

// Pro component-gated
import { NativeVideo, VimeoEmbed, YouTubeEmbed } from '@tour-kit/media'
import { ScheduleGate } from '@tour-kit/scheduling'

export function AllTestBlocks() {
  return (
    <>
      <h2 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>
        Free Packages (3)
      </h2>

      <TestBlock testId="core" pkg="@tour-kit/core" type="free">
        <TourProvider>
          <div>TourProvider rendered</div>
        </TourProvider>
      </TestBlock>

      <TestBlock testId="react" pkg="@tour-kit/react" type="free">
        <Tour id="license-test-next">
          <TourStep id="step-1" target="#test-btn" content="Hello" />
        </Tour>
        <div>Tour + TourStep rendered</div>
      </TestBlock>

      <TestBlock testId="hints" pkg="@tour-kit/hints" type="free">
        <HintsProvider>
          <div>HintsProvider rendered</div>
        </HintsProvider>
      </TestBlock>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
        Pro Provider-Gated (5)
      </h2>

      <TestBlock testId="adoption" pkg="@tour-kit/adoption" type="pro">
        <AdoptionProvider features={[]}>
          <div>AdoptionProvider rendered</div>
        </AdoptionProvider>
      </TestBlock>

      <TestBlock testId="ai" pkg="@tour-kit/ai" type="pro">
        <AiChatProvider config={{ endpoint: '/api/chat' }}>
          <div>AiChatProvider rendered</div>
        </AiChatProvider>
      </TestBlock>

      <TestBlock testId="analytics" pkg="@tour-kit/analytics" type="pro">
        <AnalyticsProvider config={{ plugins: [], enabled: false }}>
          <div>AnalyticsProvider rendered</div>
        </AnalyticsProvider>
      </TestBlock>

      <TestBlock testId="announcements" pkg="@tour-kit/announcements" type="pro">
        <AnnouncementsProvider>
          <div>AnnouncementsProvider rendered</div>
        </AnnouncementsProvider>
      </TestBlock>

      <TestBlock testId="checklists" pkg="@tour-kit/checklists" type="pro">
        <ChecklistProvider checklists={[]}>
          <div>ChecklistProvider rendered</div>
        </ChecklistProvider>
      </TestBlock>

      <h2 style={{ fontSize: '16px', fontWeight: 600, marginTop: '16px', marginBottom: '8px' }}>
        Pro Component-Gated (3)
      </h2>

      <TestBlock testId="media-youtube" pkg="@tour-kit/media" type="pro">
        <YouTubeEmbed videoId="dQw4w9WgXcQ" title="Test YouTube Video" />
      </TestBlock>

      <TestBlock testId="media-vimeo" pkg="@tour-kit/media" type="pro">
        <VimeoEmbed videoId="76979871" title="Test Vimeo Video" />
      </TestBlock>

      <TestBlock testId="media-native" pkg="@tour-kit/media" type="pro">
        <NativeVideo src="https://www.w3schools.com/html/mov_bbb.mp4" alt="Test native video" />
      </TestBlock>

      <TestBlock testId="scheduling" pkg="@tour-kit/scheduling" type="pro">
        <ScheduleGate>
          <div>ScheduleGate rendered</div>
        </ScheduleGate>
      </TestBlock>
    </>
  )
}

function TestBlock({
  testId,
  pkg,
  type,
  children,
}: {
  testId: string
  pkg: string
  type: 'free' | 'pro'
  children: ReactNode
}) {
  return (
    <div
      data-testid={`test-block-${testId}`}
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: '8px',
        overflow: 'hidden',
        marginBottom: '12px',
      }}
    >
      <div
        style={{
          padding: '8px 16px',
          background: type === 'free' ? '#ecfdf5' : '#eff6ff',
          borderBottom: '1px solid #e5e7eb',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
        }}
      >
        <code style={{ fontSize: '13px', fontWeight: 600 }}>{pkg}</code>
        <span
          data-testid={`test-badge-${testId}`}
          style={{
            fontSize: '11px',
            padding: '2px 8px',
            borderRadius: '9999px',
            background: type === 'free' ? '#d1fae5' : '#dbeafe',
            color: type === 'free' ? '#065f46' : '#1e40af',
          }}
        >
          {type === 'free' ? 'FREE' : 'PRO'}
        </span>
      </div>
      <div style={{ padding: '16px' }} data-testid={`test-content-${testId}`}>
        <ErrorBoundary
          fallback={<div data-testid={`test-error-${testId}`}>Component error</div>}
        >
          {children}
        </ErrorBoundary>
      </div>
    </div>
  )
}

interface ErrorBoundaryProps {
  fallback: ReactNode
  children: ReactNode
}

interface ErrorBoundaryState {
  hasError: boolean
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): ErrorBoundaryState {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[License Test] Component error:', error, info)
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback
    }
    return this.props.children
  }
}
