import './globals.css'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import type { ReactNode } from 'react'

export const metadata: Metadata = {
  title: {
    template: '%s | TourKit',
    default: 'TourKit - Product Tours for React',
  },
  description:
    'The most developer-friendly, accessible product tour library for React. Headless hooks and pre-styled components.',
  keywords: [
    'react',
    'product tour',
    'onboarding',
    'tutorial',
    'walkthrough',
    'hints',
    'tooltip',
    'headless',
    'typescript',
    'tailwind',
    'shadcn',
  ],
  authors: [{ name: 'TourKit Team' }],
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    title: 'TourKit - Product Tours for React',
    description: 'The most developer-friendly, accessible product tour library for React.',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'TourKit - Product Tours for React',
    description: 'The most developer-friendly, accessible product tour library for React.',
  },
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html
      lang="en"
      className={`${GeistSans.variable} ${GeistMono.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="alternate" type="text/plain" href="/llms.txt" title="LLM Documentation Index" />
      </head>
      <body
        style={{
          display: 'flex',
          flexDirection: 'column',
          minHeight: '100vh',
        }}
      >
        <RootProvider>{children}</RootProvider>
      </body>
    </html>
  )
}
