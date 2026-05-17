import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import './globals.css'
import Providers from './providers'

export const metadata: Metadata = {
  title: 'LexGuard — AI Contract Intelligence',
  description: 'Know exactly what you\'re signing. LexGuard analyzes legal contracts in seconds and tells you exactly what could hurt you.',
  keywords: ['contract analysis', 'AI legal', 'risk assessment', 'NDA', 'employment contract'],
  authors: [{ name: 'LexGuard AI' }],
  openGraph: {
    title: 'LexGuard — AI Contract Intelligence',
    description: 'AI-powered contract analysis that protects you from hidden risks',
    type: 'website',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={GeistSans.variable}>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
