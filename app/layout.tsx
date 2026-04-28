import type { Metadata } from 'next'
import { Playfair_Display, DM_Sans } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import './globals.css'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const dmSans = DM_Sans({
  subsets: ['latin'],
  variable: '--font-dm-sans',
  display: 'swap',
})

const siteUrl = (process.env.NEXT_PUBLIC_APP_URL || 'https://cashclimb.org').replace(/\/$/, '')
const socialImage = '/opengraph-image'

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'CashClimb — Personal Finance & Investing Intelligence',
    template: '%s | CashClimb',
  },
  description:
    'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
  keywords: ['personal finance', 'investing', 'wealth building', 'budgeting', 'financial independence'],
  applicationName: 'CashClimb',
  authors: [{ name: 'CashClimb Editorial' }],
  creator: 'CashClimb',
  publisher: 'CashClimb',
  robots: { index: true, follow: true },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'CashClimb',
    title: 'CashClimb — Personal Finance & Investing Intelligence',
    description:
      'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
    images: [{ url: socialImage, width: 1200, height: 630, alt: 'CashClimb' }],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@cashclimb',
    title: 'CashClimb — Personal Finance & Investing Intelligence',
    description:
      'Clear, jargon-free financial insights on investing, personal finance, credit, and wealth-building for people who take their financial future seriously.',
    images: [socialImage],
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${playfair.variable} ${dmSans.variable}`}>
      <body className="bg-bg text-[#F0EDE8] font-sans antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            style: {
              background: '#1A1A1A',
              color: '#F0EDE8',
              border: '1px solid #2A2A2A',
              fontFamily: 'var(--font-dm-sans)',
            },
            success: { iconTheme: { primary: '#D4AF37', secondary: '#0D0D0D' } },
          }}
        />
      </body>
    </html>
  )
}