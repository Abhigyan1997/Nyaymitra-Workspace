import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'NyayMitra - Enterprise Legal Operations',
  description:
    'Premium legal operations platform for growing businesses. Manage matters, documents, timesheets, and billing with advanced analytics.',

  icons: {
    icon: '/icon.svg',
    apple: '/apple-icon.png',
  },

  openGraph: {
    title: 'NyayMitra - Enterprise Legal Operations',
    description:
      'Premium legal operations platform for growing businesses.',
    type: 'website',
  },
}

export const viewport: Viewport = {
  colorScheme: 'dark',
  themeColor: [
    {
      media: '(prefers-color-scheme: dark)',
      color: '#F59E0B',
    },
  ],
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="dark bg-background scroll-smooth">
      <body className="bg-background text-foreground antialiased font-sans">
        {children}

        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}