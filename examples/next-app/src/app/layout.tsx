import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'TourKit Next.js Demo',
  description: 'Demo of TourKit in Next.js App Router',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
