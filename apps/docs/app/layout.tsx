import './globals.css'
import { SkipNav } from '@/components/skip-nav'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import type { Metadata } from 'next'
import { GoogleAnalytics } from '@next/third-parties/google'
import type { ReactNode } from 'react'

const GA_ID =
  process.env.NEXT_PUBLIC_GA_ID ??
  (process.env.NODE_ENV === 'production' ? 'G-CLV830MRY4' : undefined)

export const metadata: Metadata = {
  metadataBase: new URL('https://usertourkit.com'),
  title: {
    template: '%s | userTourKit',
    default: 'userTourKit - Product Tours for React',
  },
  description:
    'The most developer-friendly, accessible product tour library for React. Headless hooks and pre-styled components.',
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-image-preview': 'large',
      'max-snippet': -1,
      'max-video-preview': -1,
    },
  },
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
  authors: [{ name: 'userTourKit Team' }],
  openGraph: {
    title: 'userTourKit - Product Tours for React',
    description: 'The most developer-friendly, accessible product tour library for React.',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'userTourKit',
    images: ['/og-default.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'userTourKit - Product Tours for React',
    description: 'The most developer-friendly, accessible product tour library for React.',
    images: ['/og-default.png'],
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
        <SkipNav />
        <RootProvider>{children}</RootProvider>
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  )
}
