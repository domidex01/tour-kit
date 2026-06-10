import { Providers } from '@/app/providers'
import { TooltipProvider } from '@/components/ui/tooltip'
import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import './globals.css'

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
})

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
})

export const metadata: Metadata = {
  title: 'Helm — B2B project analytics',
  description: 'Helm — the project-analytics workspace. Full User Tour Kit Pro integration demo.',
}

// Apply dark mode before first paint so the dashboard loads dark with no flash.
// Honors a stored preference; defaults to dark when none is set.
const themeBootScript = `(function(){try{var t=localStorage.getItem('theme');var dark=t!=='light';var r=document.documentElement;r.classList.toggle('dark',dark);r.style.colorScheme=dark?'dark':'light';}catch(e){document.documentElement.classList.add('dark');}})();`

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <head>
        {/* biome-ignore lint/security/noDangerouslySetInnerHtml: tiny, static, first-paint theme boot — no user input */}
        <script dangerouslySetInnerHTML={{ __html: themeBootScript }} />
      </head>
      <body className="min-h-full flex flex-col">
        <TooltipProvider>
          <Providers>{children}</Providers>
        </TooltipProvider>
      </body>
    </html>
  )
}
