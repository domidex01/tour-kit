import './globals.css'
import { SaleAnnouncementBanner } from '@/components/sale-announcement-banner'
import { SkipNav } from '@/components/skip-nav'
import { WebMcp } from '@/components/webmcp'
import { GoogleAnalytics } from '@next/third-parties/google'
import { RootProvider } from 'fumadocs-ui/provider/next'
import { GeistMono } from 'geist/font/mono'
import type { Metadata } from 'next'
import { Host_Grotesk } from 'next/font/google'
import type { ReactNode } from 'react'

/**
 * Host Grotesk is the display + text face of the redesign (Figma 3945:1460).
 * It ships as a variable font over 300-800, so the 400/600/800 the design
 * uses come out of one file — no per-weight requests to declare.
 */
const hostGrotesk = Host_Grotesk({
  subsets: ['latin'],
  variable: '--font-host-grotesk',
  display: 'swap',
})

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
      className={`${hostGrotesk.variable} ${GeistMono.variable}`}
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
        <WebMcp />
        <SaleAnnouncementBanner />
        <RootProvider theme={{ defaultTheme: 'dark', enableSystem: false }}>
          {children}
        </RootProvider>
      </body>
      {GA_ID ? <GoogleAnalytics gaId={GA_ID} /> : null}
    </html>
  )
}
